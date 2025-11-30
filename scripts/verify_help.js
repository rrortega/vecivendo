const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = 'contenidos';
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function verifyArticles() {
    try {
        console.log('Verifying articles...');
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.limit(5)]
        );

        console.log(`Found ${response.total} articles.`);
        response.documents.forEach(doc => {
            console.log(`- [${doc.category}] ${doc.titulo} (slug: ${doc.slug})`);
        });

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verifyArticles();
