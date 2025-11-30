import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'avisos_comunidad';

async function setupAvisosCollection() {
    try {
        console.log('Checking if collection exists...');
        try {
            await databases.getCollection(dbId, collectionId);
            console.log('✅ Collection already exists.');
        } catch (error) {
            if (error.code === 404) {
                console.log('Creating collection...');
                await databases.createCollection(
                    dbId,
                    collectionId,
                    'Avisos Comunidad',
                    [
                        Permission.read(Role.any()),
                        Permission.write(Role.team('admins')), // Only admins can write
                        Permission.update(Role.team('admins')),
                        Permission.delete(Role.team('admins')),
                    ]
                );
                console.log('✅ Collection created.');
            } else {
                throw error;
            }
        }

        console.log('Checking attributes...');

        // Helper to create attribute if not exists
        const createString = async (key, size, required) => {
            try {
                await databases.createStringAttribute(dbId, collectionId, key, size, required);
                console.log(`✅ Attribute '${key}' created.`);
            } catch (e) {
                if (e.code === 409) console.log(`ℹ️ Attribute '${key}' already exists.`);
                else console.error(`❌ Error creating '${key}':`, e.message);
            }
        };

        const createEnum = async (key, elements, required, def) => {
            try {
                await databases.createEnumAttribute(dbId, collectionId, key, elements, required, def);
                console.log(`✅ Attribute '${key}' created.`);
            } catch (e) {
                if (e.code === 409) console.log(`ℹ️ Attribute '${key}' already exists.`);
                else console.error(`❌ Error creating '${key}':`, e.message);
            }
        }

        const createDatetime = async (key, required) => {
            try {
                await databases.createDatetimeAttribute(dbId, collectionId, key, required);
                console.log(`✅ Attribute '${key}' created.`);
            } catch (e) {
                if (e.code === 409) console.log(`ℹ️ Attribute '${key}' already exists.`);
                else console.error(`❌ Error creating '${key}':`, e.message);
            }
        }

        // Define attributes
        await createString('titulo', 100, true);
        await createString('descripcion', 1000, true);
        // Appwrite: Required attributes cannot have a default value.
        // So we make it not required (false) to set a default 'info'.
        await createEnum('nivel', ['info', 'critical', 'warning'], false, 'info');
        await createDatetime('fecha_inicio', true);
        await createDatetime('fecha_fin', false);

        // Relationship to Residenciales
        // User requested native Appwrite relationship.
        // We'll create a Many-to-One relationship: Many Avisos belong to One Residential.
        // Key in this collection: 'residencial'
        // Key in other collection: 'avisos'

        try {
            // Try to delete the old string attribute if it exists to avoid confusion
            await databases.deleteAttribute(dbId, collectionId, 'residencial_id');
            console.log("⚠️ Deleted old 'residencial_id' string attribute.");
        } catch (e) {
            // Ignore if not found
        }

        try {
            // createRelationshipAttribute(databaseId, collectionId, relatedCollectionId, type, twoWay, key, twoWayKey, onDelete)
            // Type: 'manyToOne' (Many avisos to one residential)
            await databases.createRelationshipAttribute(
                dbId,
                collectionId,
                'residenciales', // Related collection ID
                'manyToOne',     // Type
                true,            // TwoWay
                'residencial',   // Key (in avisos)
                'avisos',        // TwoWayKey (in residenciales)
                'cascade'        // OnDelete
            );
            console.log("✅ Relationship 'residencial' (Many-to-One) created.");
        } catch (e) {
            if (e.code === 409) console.log("ℹ️ Relationship 'residencial' already exists.");
            else console.error("❌ Error creating relationship:", e.message);
        }

        console.log('✅ All attributes setup complete.');

    } catch (error) {
        console.error('Setup failed:', error);
    }
}

setupAvisosCollection();
