import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";
const collectionId = "reviews";

async function main() {
    console.log("Creating 'reviews' collection...");
    try {
        // Create Collection
        await databases.createCollection(dbId, collectionId, "Reviews");
        console.log("Collection created.");

        // Create Attributes
        console.log("Creating attributes...");
        await databases.createStringAttribute(dbId, collectionId, "anuncio_id", 36, true);
        await databases.createIntegerAttribute(dbId, collectionId, "puntuacion", true, 1, 5);
        await databases.createStringAttribute(dbId, collectionId, "comentario", 1000, true);
        await databases.createStringAttribute(dbId, collectionId, "autor_nombre", 100, true);

        // Wait a bit for attributes to be processed
        console.log("Attributes creation initiated. Waiting for availability...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create Index for anuncio_id to allow filtering
        console.log("Creating index on anuncio_id...");
        await databases.createIndex(dbId, collectionId, "idx_anuncio", "key", ["anuncio_id"], ["asc"]);

        console.log("Done!");
    } catch (error) {
        console.error("Error creating collection/attributes:", error);
    }
}

main().catch(console.error);
