
const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'anuncios';

async function addAttribute() {
    console.log('Adding fecha_actualizacion attribute to anuncios...');
    try {
        // key, required, xdefault
        await databases.createDatetimeAttribute(dbId, collectionId, 'fecha_actualizacion', false);
        console.log('Created attribute fecha_actualizacion');

        // Wait a bit for attribute to be created before indexing
        console.log('Waiting for attribute creation...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create index
        await databases.createIndex(dbId, collectionId, 'idx_content_updated', 'key', ['fecha_actualizacion'], ['DESC']);
        console.log('Created index idx_content_updated');

    } catch (e) {
        console.log('Error adding attribute/index:', e.message);
    }
}

addAttribute();
