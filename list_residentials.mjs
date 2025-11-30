import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

async function listResidentials() {
    try {
        const response = await databases.listDocuments(dbId, 'residenciales');
        console.log(`\n📍 Found ${response.documents.length} residentials:\n`);

        response.documents.forEach((doc, idx) => {
            console.log(`${idx + 1}. ${doc.nombre}`);
            console.log(`   Slug: ${doc.slug}`);
            console.log(`   ID: ${doc.$id}`);
            console.log(`   Activo: ${doc.activo !== false ? 'Yes' : 'No'}`);
            console.log('');
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

listResidentials();
