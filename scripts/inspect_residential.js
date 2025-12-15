
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const residentialsId = 'residenciales';

async function checkResidential() {
    try {
        const response = await databases.listDocuments(
            dbId,
            residentialsId,
            [Query.limit(1)]
        );

        if (response.documents.length > 0) {
            console.log('Keys:', Object.keys(response.documents[0]));
            // Also print raw doc to see values
            console.log('Sample:', JSON.stringify(response.documents[0], null, 2));
        } else {
            console.log('No residentials found.');
        }
    } catch (e) {
        console.error(e);
    }
}

checkResidential();
