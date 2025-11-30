const sdk = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new sdk.Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

if (!endpoint || !projectId || !apiKey) {
    console.error('Error: Missing required environment variables.');
    console.log('Ensure NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, and APPWRITE_API_KEY are set in .env.local');
    process.exit(1);
}

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new sdk.Databases(client);

async function cleanupCollections() {
    try {
        console.log(`Listing collections in database ${databaseId}...`);
        const collections = await databases.listCollections(databaseId);

        const pedidosCollection = collections.collections.find(c => c.name === 'pedidos');

        if (pedidosCollection) {
            console.log(`Found redundant collection 'pedidos' (ID: ${pedidosCollection.$id}). Deleting...`);
            await databases.deleteCollection(databaseId, pedidosCollection.$id);
            console.log("Collection 'pedidos' deleted successfully.");
        } else {
            console.log("Collection 'pedidos' not found. No action needed.");
        }

        // Verify 'orders' exists
        const ordersCollection = collections.collections.find(c => c.name === 'orders');
        if (ordersCollection) {
            console.log(`Confirmed 'orders' collection exists (ID: ${ordersCollection.$id}).`);
        } else {
            console.warn("Warning: 'orders' collection NOT found. You might need to run create_orders_collection.js");
        }

    } catch (error) {
        console.error('Error cleaning up collections:', error);
    }
}

cleanupCollections();
