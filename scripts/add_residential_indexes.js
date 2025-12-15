
const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'residenciales';

async function addIndexes() {
    console.log('Adding indexes to residentials...');
    try {
        // total_anuncios_gratis
        try {
            // key, type (key), attributes, orders
            await databases.createIndex(dbId, collectionId, 'idx_total_gratis', 'key', ['total_anuncios_gratis'], ['DESC']);
            console.log('Created index idx_total_gratis');
        } catch (e) {
            console.log('idx_total_gratis error:', e.message);
        }

        // total_anuncios_pago
        try {
            await databases.createIndex(dbId, collectionId, 'idx_total_pago', 'key', ['total_anuncios_pago'], ['DESC']);
            console.log('Created index idx_total_pago');
        } catch (e) {
            console.log('idx_total_pago error:', e.message);
        }

    } catch (e) {
        console.error('Error adding indexes:', e);
    }
}

addIndexes();
