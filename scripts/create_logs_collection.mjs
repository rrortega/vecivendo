// scripts/create_logs_collection.mjs
import 'dotenv/config';
import { Client, Databases, Permission, Role } from "node-appwrite";

// Initialize client
const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Helper to create a collection if it does not exist
async function ensureCollection(databaseId, collectionId, name, permissions = []) {
    try {
        await databases.getCollection(databaseId, collectionId);
        console.log(`Collection ${name} already exists`);
    } catch (e) {
        console.log(`Creating collection ${name}`);
        await databases.createCollection(databaseId, collectionId, name, permissions);
    }
}

// Helper to add an attribute if it does not exist
async function ensureAttribute(databaseId, collectionId, attrFn, ...args) {
    try {
        // Try to create; if it already exists Appwrite returns an error which we catch
        await attrFn(databaseId, collectionId, ...args);
        console.log(`Attribute created in ${collectionId}`);
    } catch (e) {
        // Assume attribute already exists
        console.log(`Attribute may already exist in ${collectionId}: ${e.message}`);
    }
}

async function main() {
    const dbId = "vecivendo-db";
    const collectionId = "logs";

    // 1. Create Collection with Permissions
    // Role: Any -> create
    // Role: Admin (or users) -> read, update, delete (adjust as needed, maybe just read for admin)
    // For now, let's give create to any, and full access to admins.
    const permissions = [
        Permission.create(Role.any()),
        Permission.read(Role.users()), // Or specific team
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
    ];

    await ensureCollection(dbId, collectionId, "Logs", permissions);

    // 2. Create Attributes
    // anuncioId (Relationship to anuncios, Cascade)
    await ensureAttribute(dbId, collectionId, databases.createRelationshipAttribute.bind(databases), "anuncios", "manyToOne", false, "anuncioId", null, "cascade");

    // anuncioPagoId (Relationship to anuncios_pago, Cascade, Optional)
    // Note: anuncios_pago might not exist yet, so this might fail if the collection doesn't exist.
    // We will wrap it in a try-catch or check existence.
    try {
        await ensureAttribute(dbId, collectionId, databases.createRelationshipAttribute.bind(databases), "anuncios_pago", "manyToOne", false, "anuncioPagoId", null, "cascade");
    } catch (e) {
        console.log("Skipping anuncioPagoId relationship as anuncios_pago collection might not exist yet.");
    }

    // type (String)
    await ensureAttribute(dbId, collectionId, databases.createStringAttribute.bind(databases), "type", 50, true);

    // sessionId (String)
    await ensureAttribute(dbId, collectionId, databases.createStringAttribute.bind(databases), "sessionId", 255, true);

    // visitorId (String, Optional)
    await ensureAttribute(dbId, collectionId, databases.createStringAttribute.bind(databases), "visitorId", 255, false);

    // deviceType (String)
    await ensureAttribute(dbId, collectionId, databases.createStringAttribute.bind(databases), "deviceType", 50, false);

    // os (String)
    await ensureAttribute(dbId, collectionId, databases.createStringAttribute.bind(databases), "os", 50, false);

    // browser (String)
    await ensureAttribute(dbId, collectionId, databases.createStringAttribute.bind(databases), "browser", 50, false);

    // source (String)
    await ensureAttribute(dbId, collectionId, databases.createStringAttribute.bind(databases), "source", 255, false);

    // timestamp (Datetime)
    await ensureAttribute(dbId, collectionId, databases.createDatetimeAttribute.bind(databases), "timestamp", true);

    // 3. Create Indexes
    // idx_session_time: sessionId, timestamp
    try {
        await databases.createIndex(dbId, collectionId, "idx_session_time", "key", ["sessionId", "timestamp"], ["asc", "desc"]);
        console.log("Index idx_session_time created");
    } catch (e) {
        console.log(`Index idx_session_time may already exist: ${e.message}`);
    }

    // idx_anuncio_time: anuncioId, timestamp
    try {
        await databases.createIndex(dbId, collectionId, "idx_anuncio_time", "key", ["anuncioId", "timestamp"], ["asc", "desc"]);
        console.log("Index idx_anuncio_time created");
    } catch (e) {
        console.log(`Index idx_anuncio_time may already exist: ${e.message}`);
    }

    // idx_type: type
    try {
        await databases.createIndex(dbId, collectionId, "idx_type", "key", ["type"], ["asc"]);
        console.log("Index idx_type created");
    } catch (e) {
        console.log(`Index idx_type may already exist: ${e.message}`);
    }

    console.log("Logs collection setup completed.");
}

main().catch((err) => {
    console.error("Error creating logs collection:", err);
});
