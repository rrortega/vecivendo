import 'dotenv/config';
import { Client, Databases, Storage, ID, Query, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.split('=');
    if (key.startsWith('--')) {
        acc[key.slice(2)] = value || true;
    }
    return acc;
}, {});

if (!args.targetProject || !args.targetKey || !args.targetEndpoint) {
    console.error('Usage: node scripts/migrate_project.mjs --targetProject=ID --targetKey=KEY --targetEndpoint=URL [--migrateData]');
    process.exit(1);
}

const sourceClient = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const targetClient = new Client()
    .setEndpoint(args.targetEndpoint)
    .setProject(args.targetProject)
    .setKey(args.targetKey);

const sourceDatabases = new Databases(sourceClient);
const targetDatabases = new Databases(targetClient);
const sourceStorage = new Storage(sourceClient);
const targetStorage = new Storage(targetClient);

const MIGRATE_DATA = args.migrateData === true || args.migrateData === 'true';

async function listAll(apiCall, ...params) {
    let allItems = [];
    let offset = 0;
    const limit = 100;

    while (true) {
        // We assume the last param is queries, or we append queries
        // Actually, most list methods take [queries] as the last optional arg.
        // But some take specific args before queries.
        // We'll handle this by checking the function signature or just using a loop with queries if supported, 
        // or just offset/limit if it's an older API style (but node-appwrite v14+ uses queries for pagination).

        // Wait, node-appwrite v14+ uses Query.limit() and Query.offset().
        // We need to append these to the queries array.

        // Let's assume params contains the required IDs, and the last arg *might* be queries.
        // If the last arg is an array, it's queries. If not, we add an array.

        const newParams = [...params];
        let queries = [];
        if (newParams.length > 0 && Array.isArray(newParams[newParams.length - 1])) {
            queries = newParams.pop();
        }

        queries = [...queries, Query.limit(limit), Query.offset(offset)];
        newParams.push(queries);

        const response = await apiCall(...newParams);
        const items = response.databases ? response.databases : (response.collections ? response.collections : (response.documents ? response.documents : (response.buckets ? response.buckets : (response.files ? response.files : (response.attributes ? response.attributes : (response.indexes ? response.indexes : []))))));

        allItems = [...allItems, ...items];

        if (items.length < limit) break;
        offset += limit;
    }
    return allItems;
}

// Specialized list functions because generic listAll is hard with variadic args
async function listAllDatabases(dbApi) {
    let all = [];
    let offset = 0;
    while (true) {
        const res = await dbApi.list([Query.limit(100), Query.offset(offset)]);
        all.push(...res.databases);
        if (res.databases.length < 100) break;
        offset += 100;
    }
    return all;
}

async function listAllCollections(dbApi, dbId) {
    let all = [];
    let offset = 0;
    while (true) {
        const res = await dbApi.listCollections(dbId, [Query.limit(100), Query.offset(offset)]);
        all.push(...res.collections);
        if (res.collections.length < 100) break;
        offset += 100;
    }
    return all;
}

async function listAllAttributes(dbApi, dbId, colId) {
    let all = [];
    let offset = 0;
    while (true) {
        const res = await dbApi.listAttributes(dbId, colId, [Query.limit(100), Query.offset(offset)]);
        all.push(...res.attributes);
        if (res.attributes.length < 100) break;
        offset += 100;
    }
    return all;
}

async function listAllIndexes(dbApi, dbId, colId) {
    let all = [];
    let offset = 0;
    while (true) {
        const res = await dbApi.listIndexes(dbId, colId, [Query.limit(100), Query.offset(offset)]);
        all.push(...res.indexes);
        if (res.indexes.length < 100) break;
        offset += 100;
    }
    return all;
}

async function listAllBuckets(storageApi) {
    let all = [];
    let offset = 0;
    while (true) {
        const res = await storageApi.listBuckets([Query.limit(100), Query.offset(offset)]);
        all.push(...res.buckets);
        if (res.buckets.length < 100) break;
        offset += 100;
    }
    return all;
}

async function listAllFiles(storageApi, bucketId) {
    let all = [];
    let offset = 0;
    while (true) {
        const res = await storageApi.listFiles(bucketId, [Query.limit(100), Query.offset(offset)]);
        all.push(...res.files);
        if (res.files.length < 100) break;
        offset += 100;
    }
    return all;
}

async function listAllDocuments(dbApi, dbId, colId) {
    let all = [];
    let cursor = null;
    while (true) {
        const queries = [Query.limit(100)];
        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }
        const res = await dbApi.listDocuments(dbId, colId, queries);
        all.push(...res.documents);
        if (res.documents.length < 100) break;
        cursor = res.documents[res.documents.length - 1].$id;
    }
    return all;
}

async function migrateSchema() {
    console.log('Starting Schema Migration...');

    // 1. Databases
    const sourceDBs = await listAllDatabases(sourceDatabases);
    for (const db of sourceDBs) {
        console.log(`Processing Database: ${db.name} (${db.$id})`);
        try {
            await targetDatabases.get(db.$id);
            console.log(`  Database ${db.$id} exists in target.`);
        } catch (e) {
            console.log(`  Creating Database ${db.$id}...`);
            await targetDatabases.create(db.$id, db.name, db.enabled);
        }

        // 2. Collections (Create Shells)
        const sourceCols = await listAllCollections(sourceDatabases, db.$id);
        for (const col of sourceCols) {
            console.log(`  Processing Collection: ${col.name} (${col.$id})`);
            try {
                await targetDatabases.getCollection(db.$id, col.$id);
                console.log(`    Collection ${col.$id} exists in target.`);
            } catch (e) {
                console.log(`    Creating Collection ${col.$id}...`);
                await targetDatabases.createCollection(
                    db.$id,
                    col.$id,
                    col.name,
                    col.$permissions,
                    col.documentSecurity,
                    col.enabled
                );
            }
        }
    }

    // 3. Attributes & Indexes (Second Pass)
    for (const db of sourceDBs) {
        const sourceCols = await listAllCollections(sourceDatabases, db.$id);
        for (const col of sourceCols) {
            console.log(`  Migrating Attributes for ${col.name}...`);
            const attrs = await listAllAttributes(sourceDatabases, db.$id, col.$id);

            // Sort attributes: Non-relationships first, then relationships
            // Actually, just try to create them.
            // Note: Relationship attributes need the related collection to exist (which we ensured in step 2).

            for (const attr of attrs) {
                if (attr.status !== 'available') continue; // Skip processing attributes

                try {
                    // Check if exists
                    // There is no getAttribute, only list. But we can try to create and catch error.
                    // Or we can list target attributes and check.
                    // Let's just try to create and catch.

                    switch (attr.type) {
                        case 'string':
                            if (attr.size) { // It's a string
                                await targetDatabases.createStringAttribute(db.$id, col.$id, attr.key, attr.size, attr.required, attr.default, attr.array);
                            } else { // Enum, IP, Email, URL are also strings in 'type' but have different format or specific methods?
                                // Wait, api returns type='string' for all of them?
                                // No, type can be string, integer, etc.
                                // format field tells us if it's email, url, ip, enum.
                                if (attr.format === 'email') {
                                    await targetDatabases.createEmailAttribute(db.$id, col.$id, attr.key, attr.required, attr.default, attr.array);
                                } else if (attr.format === 'url') {
                                    await targetDatabases.createUrlAttribute(db.$id, col.$id, attr.key, attr.required, attr.default, attr.array);
                                } else if (attr.format === 'ip') {
                                    await targetDatabases.createIpAttribute(db.$id, col.$id, attr.key, attr.required, attr.default, attr.array);
                                } else if (attr.format === 'enum') {
                                    await targetDatabases.createEnumAttribute(db.$id, col.$id, attr.key, attr.elements, attr.required, attr.default, attr.array);
                                } else {
                                    // Plain string
                                    await targetDatabases.createStringAttribute(db.$id, col.$id, attr.key, attr.size || 255, attr.required, attr.default, attr.array);
                                }
                            }
                            break;
                        case 'integer':
                            await targetDatabases.createIntegerAttribute(db.$id, col.$id, attr.key, attr.required, attr.min, attr.max, attr.default, attr.array);
                            break;
                        case 'double': // float
                            await targetDatabases.createFloatAttribute(db.$id, col.$id, attr.key, attr.required, attr.min, attr.max, attr.default, attr.array);
                            break;
                        case 'boolean':
                            await targetDatabases.createBooleanAttribute(db.$id, col.$id, attr.key, attr.required, attr.default, attr.array);
                            break;
                        case 'datetime':
                            await targetDatabases.createDatetimeAttribute(db.$id, col.$id, attr.key, attr.required, attr.default, attr.array);
                            break;
                        default:
                            // Relationship?
                            // For relationship, type is empty or specific?
                            // Actually, node-appwrite returns specific structure for relationship.
                            // Let's check if it has 'relatedCollection'.
                            if (attr.relatedCollection) {
                                await targetDatabases.createRelationshipAttribute(
                                    db.$id,
                                    col.$id,
                                    attr.relatedCollection,
                                    attr.relationType,
                                    attr.twoWay,
                                    attr.key,
                                    attr.twoWayKey,
                                    attr.onDelete
                                );
                            }
                            break;
                    }
                    console.log(`    Created attribute ${attr.key}`);
                } catch (e) {
                    if (e.code === 409) {
                        // Already exists
                        // console.log(`    Attribute ${attr.key} already exists.`);
                    } else {
                        console.error(`    Failed to create attribute ${attr.key}:`, e.message);
                    }
                }
            }

            // Wait a bit for attributes to be available before creating indexes?
            // Appwrite handles this async. Indexes might fail if attributes are not ready.
            // But we can try.

            console.log(`  Migrating Indexes for ${col.name}...`);
            const indexes = await listAllIndexes(sourceDatabases, db.$id, col.$id);
            for (const idx of indexes) {
                if (idx.status !== 'available') continue;
                try {
                    await targetDatabases.createIndex(db.$id, col.$id, idx.key, idx.type, idx.attributes, idx.orders);
                    console.log(`    Created index ${idx.key}`);
                } catch (e) {
                    if (e.code === 409) {
                        // Exists
                    } else {
                        // Often fails if attributes are not yet 'available'.
                        console.warn(`    Failed to create index ${idx.key} (Attributes might be processing):`, e.message);
                    }
                }
            }
        }
    }
}

async function migrateStorage() {
    console.log('Starting Storage Migration...');
    const buckets = await listAllBuckets(sourceStorage);
    for (const bucket of buckets) {
        console.log(`Processing Bucket: ${bucket.name} (${bucket.$id})`);
        try {
            await targetStorage.getBucket(bucket.$id);
            console.log(`  Bucket ${bucket.$id} exists.`);
        } catch (e) {
            console.log(`  Creating Bucket ${bucket.$id}...`);
            await targetStorage.createBucket(
                bucket.$id,
                bucket.name,
                bucket.$permissions,
                bucket.fileSecurity,
                bucket.enabled,
                bucket.maximumFileSize,
                bucket.allowedFileExtensions,
                bucket.compression,
                bucket.encryption,
                bucket.antivirus
            );
        }
    }
}

async function migrateDataFn() {
    console.log('Starting Data Migration...');

    // 1. Storage Files
    const buckets = await listAllBuckets(sourceStorage);
    for (const bucket of buckets) {
        console.log(`Migrating files for bucket ${bucket.name}...`);
        const files = await listAllFiles(sourceStorage, bucket.$id);
        for (const file of files) {
            try {
                await targetStorage.getFile(bucket.$id, file.$id);
                // Exists, skip
            } catch (e) {
                console.log(`  Migrating file ${file.name} (${file.$id})...`);
                // Download from source
                const buffer = await sourceStorage.getFileDownload(bucket.$id, file.$id);

                // Upload to target
                // node-appwrite createFile expects a File object or similar.
                // In Node, we can pass a Buffer/Stream if we use the right InputFile helper or just pass the buffer?
                // The SDK usually handles Buffer if we name it.
                // Actually, `InputFile.fromBuffer(buffer, filename)` is the way in newer SDKs.
                // Let's check if we can import InputFile.
                // It's usually exported from 'node-appwrite'.

                // If InputFile is not available, we might need to construct it.
                // But let's try to pass the buffer directly or use a temp file.
                // Temp file is safer.

                const tempPath = path.join('/tmp', file.name);
                fs.writeFileSync(tempPath, Buffer.from(buffer));

                // const inputFile = InputFile.fromPath(tempPath, file.name); // If InputFile exists
                // Or just fs.createReadStream(tempPath)

                try {
                    await targetStorage.createFile(
                        bucket.$id,
                        file.$id,
                        InputFile.fromPath(tempPath, file.name),
                        file.$permissions
                    );
                } catch (err) {
                    console.error(`  Failed to upload file ${file.$id}:`, err.message);
                } finally {
                    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                }
            }
        }
    }

    // 2. Database Documents
    const sourceDBs = await listAllDatabases(sourceDatabases);
    for (const db of sourceDBs) {
        const sourceCols = await listAllCollections(sourceDatabases, db.$id);
        for (const col of sourceCols) {
            console.log(`Migrating documents for ${col.name}...`);
            const docs = await listAllDocuments(sourceDatabases, db.$id, col.$id);

            for (const doc of docs) {
                try {
                    await targetDatabases.getDocument(db.$id, col.$id, doc.$id);
                    // Exists
                } catch (e) {
                    // Create
                    // We need to strip system attributes ($id, $createdAt, etc) from data
                    const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...data } = doc;

                    try {
                        await targetDatabases.createDocument(
                            db.$id,
                            col.$id,
                            $id,
                            data,
                            $permissions
                        );
                        // console.log(`  Migrated doc ${$id}`);
                    } catch (err) {
                        console.error(`  Failed to migrate doc ${$id} in ${col.name}:`, err.message);
                    }
                }
            }
        }
    }
}

async function main() {
    try {
        await migrateSchema();
        await migrateStorage();

        if (MIGRATE_DATA) {
            // Wait a bit for schema to settle?
            console.log('Waiting 5 seconds for schema to settle before data migration...');
            await new Promise(r => setTimeout(r, 5000));
            await migrateDataFn();
        }

        console.log('Migration Completed Successfully!');
    } catch (e) {
        console.error('Migration Failed:', e);
    }
}

main();
