
const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'residenciales';

async function addAttributes() {
    console.log('Adding attributes to residentials...');
    try {
        // total_anuncios_gratis
        try {
            await databases.createIntegerAttribute(dbId, collectionId, 'total_anuncios_gratis', false, 0, 2000000000, 0);
            console.log('Created total_anuncios_gratis');
        } catch (e) {
            console.log('total_anuncios_gratis might already exist:', e.message);
        }

        // total_anuncios_pago
        try {
            await databases.createIntegerAttribute(dbId, collectionId, 'total_anuncios_pago', false, 0, 2000000000, 0);
            console.log('Created total_anuncios_pago');
        } catch (e) {
            console.log('total_anuncios_pago might already exist:', e.message);
        }

    } catch (e) {
        console.error('Error adding attributes:', e);
    }
}

addAttributes();
