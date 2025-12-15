
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

async function checkCosts() {
    try {
        console.log('Checking costo_por_vista...');
        const views = await databases.listDocuments(dbId, 'costo_por_vista', [Query.limit(1)]);
        if (views.documents.length > 0) {
            console.log('View Cost Doc:', views.documents[0]);
        } else {
            console.log('No documents in costo_por_vista');
        }

        console.log('\nChecking costo_por_click...');
        const clicks = await databases.listDocuments(dbId, 'costo_por_click', [Query.limit(1)]);
        if (clicks.documents.length > 0) {
            console.log('Click Cost Doc:', clicks.documents[0]);
        } else {
            console.log('No documents in costo_por_click');
        }

    } catch (e) {
        console.error(e);
    }
}

checkCosts();
