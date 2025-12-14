
import { Client, Databases, Query } from "node-appwrite";
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
    console.log("Testing search queries...");

    // Test 1: Search by attribute 'titulo' (Should pass now)
    try {
        console.log("\nTest 1: Query.search('titulo', 'test')");
        const res1 = await databases.listDocuments(dbId, collectionId, [
            Query.search('titulo', 'test'),
            Query.limit(1)
        ]);
        console.log("✅ Success! Found:", res1.total);
    } catch (e) {
        console.log("❌ Failed:", e.message);
    }
}

main().catch(console.error);
