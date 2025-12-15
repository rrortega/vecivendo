
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const pedidosId = 'pedidos';

async function checkOrders() {
    try {
        const response = await databases.listDocuments(
            dbId,
            pedidosId,
            [Query.limit(5)]
        );

        response.documents.forEach(doc => {
            console.log('--- Order ---');
            console.log('ID:', doc.$id);
            console.log('Status:', doc.status); // or estado?
            console.log('Anunciante Tel:', doc.anunciante_telefono);
            console.log('Items (Raw):', doc.items); // Likely stringified JSON
            console.log('Items type:', typeof doc.items);
        });
    } catch (e) {
        console.error(e);
    }
}

checkOrders();
