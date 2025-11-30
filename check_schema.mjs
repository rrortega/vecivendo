import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

async function checkSchema() {
    try {
        const collection = await databases.getCollection(dbId, 'anuncios');
        console.log('📋 Anuncios Collection Attributes:\n');
        collection.attributes.forEach(attr => {
            console.log(`  • ${attr.key} (${attr.type}) ${attr.required ? '- REQUIRED' : ''}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();
