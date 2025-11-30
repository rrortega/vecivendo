// fix_schema.mjs
import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";

async function main() {
    console.log("Fixing 'imagenes' attribute...");

    try {
        console.log("Deleting 'imagenes' attribute...");
        await databases.deleteAttribute(dbId, "anuncios", "imagenes");
        console.log("Deleted.");

        // Wait a bit for deletion to propagate (Appwrite is async)
        await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
        console.log("Error deleting (might not exist):", e.message);
    }

    try {
        console.log("Recreating 'imagenes' attribute as array...");
        // createStringAttribute(databaseId, collectionId, key, size, required, default, array)
        // We pass null for default
        await databases.createStringAttribute(dbId, "anuncios", "imagenes", 255, false, null, true);
        console.log("Recreated.");
    } catch (e) {
        console.error("Error recreating:", e.message);
    }
}

main().catch(console.error);
