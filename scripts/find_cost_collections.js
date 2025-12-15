
const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Use the ID found in previous step or the one in env
const dbId = '68fb1bda0004ab49dbd3';

async function findCollections() {
    try {
        let offset = 0;
        let foundVista = false;
        let foundClick = false;
        let logsAttributes = [];

        while (true) {
            const response = await databases.listCollections(dbId, [], 100, offset);
            const collections = response.collections;

            if (collections.length === 0) break;

            for (const col of collections) {
                if (col.name.includes('cost') || col.name.includes('vista') || col.name.includes('click')) {
                    console.log(`Found collection: ${col.name} (ID: ${col.$id})`);
                }
                if (col.name === 'costo_por_vista') foundVista = col;
                if (col.name === 'costo_por_click') foundClick = col;
                if (col.name === 'logs') {
                    console.log('Logs collection found.');
                    console.log('Attributes:', col.attributes.map(a => `${a.key} (${a.type})`).join(', '));
                    logsAttributes = col.attributes;
                }
            }

            if (collections.length < 100) break;
            offset += 100;
        }

    } catch (e) {
        console.error(e);
    }
}

findCollections();
