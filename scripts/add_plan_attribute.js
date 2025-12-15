
const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'anuncios';

async function addPlanAttribute() {
    console.log('Adding plan attribute to anuncios...');
    try {
        await databases.createStringAttribute(dbId, collectionId, 'plan', 100, false, 'gratuito');
        console.log('Created plan attribute (default: gratuito)');
    } catch (e) {
        console.log('plan attribute might already exist or error:', e.message);
    }
}

addPlanAttribute();
