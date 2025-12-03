const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'anuncios';

async function listAds() {
    try {
        const response = await databases.listDocuments(dbId, collectionId);
        console.log("Found ads:", response.documents.map(d => ({ id: d.$id, title: d.titulo })));
    } catch (error) {
        console.error("Error listing ads:", error);
    }
}

listAds();
