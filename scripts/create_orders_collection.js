const sdk = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

// Init SDK
const client = new sdk.Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

if (!endpoint || !projectId || !apiKey) {
    console.error('Error: Missing required environment variables (NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY)');
    process.exit(1);
}

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new sdk.Databases(client);

const COLLECTION_NAME = 'orders';
const COLLECTION_ID = 'orders'; // We can use a custom ID or let Appwrite generate one. Using 'orders' for simplicity if allowed, or let's try to find it first.

async function createOrdersCollection() {
    try {
        console.log(`Checking if collection '${COLLECTION_NAME}' exists...`);
        try {
            await databases.getCollection(databaseId, COLLECTION_ID);
            console.log(`Collection '${COLLECTION_NAME}' already exists.`);
        } catch (error) {
            if (error.code === 404) {
                console.log(`Creating collection '${COLLECTION_NAME}'...`);
                await databases.createCollection(databaseId, COLLECTION_ID, COLLECTION_NAME);
                console.log(`Collection '${COLLECTION_NAME}' created.`);
            } else {
                throw error;
            }
        }

        // Define attributes
        const attributes = [
            { key: 'order_id', type: 'string', size: 50, required: true },
            { key: 'user_id', type: 'string', size: 50, required: false }, // Can be null if guest or just phone based
            { key: 'user_name', type: 'string', size: 100, required: true },
            { key: 'items', type: 'string', size: 5000, required: true }, // JSON string of items
            { key: 'total', type: 'double', required: true },
            { key: 'status', type: 'string', size: 20, required: true },
            { key: 'residential_id', type: 'string', size: 50, required: true },
            { key: 'user_phone', type: 'string', size: 20, required: true },
            { key: 'user_address', type: 'string', size: 255, required: true },
        ];

        console.log('Checking/Creating attributes...');
        for (const attr of attributes) {
            try {
                await databases.getAttribute(databaseId, COLLECTION_ID, attr.key);
                console.log(`Attribute '${attr.key}' already exists.`);
            } catch (error) {
                if (error.code === 404) {
                    console.log(`Creating attribute '${attr.key}'...`);
                    if (attr.type === 'string') {
                        await databases.createStringAttribute(databaseId, COLLECTION_ID, attr.key, attr.size, attr.required, attr.default);
                    } else if (attr.type === 'double') {
                        await databases.createFloatAttribute(databaseId, COLLECTION_ID, attr.key, attr.required, null, attr.default);
                    }
                    // Add wait to avoid race conditions with attribute creation
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    console.error(`Error checking attribute '${attr.key}':`, error.message);
                }
            }
        }

        console.log('Orders collection setup completed.');

    } catch (error) {
        console.error('Error setting up orders collection:', error);
    }
}

createOrdersCollection();
