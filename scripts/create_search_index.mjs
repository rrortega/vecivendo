import { Client, Databases } from "node-appwrite";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
const collectionId = "anuncios";

async function main() {
    console.log("Creating Fulltext index for 'anuncios'...");
    try {
        // key, collectionId, key (index name), type, attributes, orders (optional)
        // Type: key, fulltext, unique
        // Create specific index for titulo which is what the API queries
        await databases.createIndex(
            dbId,
            collectionId,
            "idx_fulltext_titulo",
            "fulltext",
            ["titulo"],
            ["asc"]
        );
        console.log("Created 'idx_fulltext_titulo'");

        // Optional: Create one for description too if we ever want to search it
        await databases.createIndex(
            dbId,
            collectionId,
            "idx_fulltext_descripcion",
            "fulltext",
            ["descripcion"],
            ["asc"]
        );
        console.log("Created 'idx_fulltext_descripcion'");
        console.log("Index creation initiated. It might take a while.");
    } catch (error) {
        console.error("Error creating index:", error);
    }
}

main().catch(console.error);
