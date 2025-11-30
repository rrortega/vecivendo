import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

// If we have an API key, use it. Otherwise, we rely on public permissions (unlikely to work for update but worth a try if no key)
if (process.env.APPWRITE_API_KEY) {
    client.setKey(process.env.APPWRITE_API_KEY);
} else {
    console.warn("No APPWRITE_API_KEY found. Trying with public access (might fail).");
}

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
const collectionId = "anuncios";

async function updateAdvertisers() {
    try {
        console.log("Fetching ads...");
        const response = await databases.listDocuments(
            dbId,
            collectionId,
            // Fetch a few ads to update
            []
        );

        console.log(`Found ${response.documents.length} ads.`);

        const updates = response.documents.slice(0, 1).map(async (doc) => {
            console.log(`Document keys: ${Object.keys(doc).join(', ')}`);
            // console.log(`Updating ad: ${doc.titulo} (${doc.$id})`);
            // ... skip update for now
        });

        await Promise.all(updates);
        console.log("Finished updating advertisers.");

    } catch (error) {
        console.error("Error:", error);
    }
}

updateAdvertisers();
