
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const adsCollection = 'anuncios';

async function checkPlan() {
    try {
        const response = await databases.listDocuments(
            dbId,
            adsCollection,
            [Query.limit(10)]
        );

        if (response.documents.length > 0) {
            console.log('Keys:', Object.keys(response.documents[0]));
            console.log('Sample:', JSON.stringify(response.documents[0], null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

checkPlan();
