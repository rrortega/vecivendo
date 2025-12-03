import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";
const collectionId = "anuncios";

async function main() {
    console.log("Creating Fulltext index for 'anuncios'...");
    try {
        // key, collectionId, key (index name), type, attributes, orders (optional)
        // Type: key, fulltext, unique
        await databases.createIndex(
            dbId,
            collectionId,
            "search_index",
            "fulltext",
            ["titulo", "descripcion"],
            ["asc", "asc"] // Order doesn't matter much for fulltext but required arg in some SDK versions or optional? 
            // Node SDK createIndex signature: (databaseId, collectionId, key, type, attributes, orders)
        );
        console.log("Index creation initiated. It might take a while.");
    } catch (error) {
        console.error("Error creating index:", error);
    }
}

main().catch(console.error);
