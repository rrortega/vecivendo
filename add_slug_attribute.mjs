import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = 'contenidos';

async function addSlugAttribute() {
    try {
        console.log('Adding slug attribute...');
        await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'slug', 255, true);
        console.log('Slug attribute created. Waiting for it to be available...');
        // Attributes take time to be available
    } catch (error) {
        console.error('Error adding slug attribute:', error);
    }
}

addSlugAttribute();
