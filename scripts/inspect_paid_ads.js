
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local in the project root
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const client = new Client();
const databases = new Databases(client);

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
const collectionId = "anuncios_pago";

async function inspect() {
    try {
        console.log(`Fetching attributes from ${dbId}.${collectionId}...`);
        const response = await databases.listAttributes(dbId, collectionId);

        console.log("Attributes:");
        response.attributes.forEach(attr => {
            console.log(`- ${attr.key} (${attr.type})`);
        });
    } catch (error) {
        console.error("Error fetching attributes:", error);
    }
}

inspect();
