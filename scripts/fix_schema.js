const sdk = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new sdk.Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;

if (!endpoint || !projectId || !apiKey || !databaseId) {
    console.error('Missing environment variables');
    process.exit(1);
}

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new sdk.Databases(client);

async function fixSchema() {
    try {
        console.log('Fixing schema for residenciales...');
        const collections = await databases.listCollections(databaseId);
        const residencialesCollection = collections.collections.find(c => c.name === 'residenciales' || c.name === 'Residenciales');

        if (!residencialesCollection) {
            console.error('Collection residenciales not found');
            return;
        }

        console.log(`Found collection: ${residencialesCollection.name} (${residencialesCollection.$id})`);

        // Attribute to delete
        const attributeKey = 'anunciosPago';

        console.log(`Deleting attribute: ${attributeKey}`);
        try {
            await databases.deleteAttribute(databaseId, residencialesCollection.$id, attributeKey);
            console.log(`Attribute ${attributeKey} deleted successfully.`);
        } catch (error) {
            console.error(`Error deleting attribute ${attributeKey}:`, error.message);
        }

    } catch (error) {
        console.error('Error fixing schema:', error);
    }
}

fixSchema();
