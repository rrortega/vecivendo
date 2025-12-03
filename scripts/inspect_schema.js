const sdk = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new sdk.Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;

if (!endpoint || !projectId || !apiKey || !databaseId) {
    console.error('Missing environment variables');
    process.exit(1);
}

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new sdk.Databases(client);

async function inspectSchema() {
    try {
        console.log('Fetching attributes for residenciales...');
        // First we need to find the collection ID for 'residenciales'
        // Assuming it's named 'residenciales' or we can list collections
        const collections = await databases.listCollections(databaseId);
        console.log('Listing all collections:');
        collections.collections.forEach(c => console.log(`- ${c.name} (${c.$id})`));

        const residencialesCollection = collections.collections.find(c => c.name === 'residenciales' || c.name === 'Residenciales');

        if (!residencialesCollection) {
            console.log('Trying to find by partial match...');
            const partialMatch = collections.collections.find(c => c.name.toLowerCase().includes('residenc'));
            if (partialMatch) {
                console.log(`Found partial match: ${partialMatch.name} (${partialMatch.$id})`);
                // Use the partial match
                var targetId = partialMatch.$id;
            } else {
                console.error('Collection residenciales not found');
                return;
            }
        } else {
            var targetId = residencialesCollection.$id;
        }

        console.log(`Inspecting collection: ${targetId}`);

        const attributes = await databases.listAttributes(databaseId, targetId);

        console.log('Attributes:');
        attributes.attributes.forEach(attr => {
            console.log(`- ${attr.key} (${attr.type}) ${attr.status ? '- ' + attr.status : ''} ${attr.error ? '- Error: ' + attr.error : ''}`);
            if (attr.type === 'relationship') {
                console.log(`  Related Collection: ${attr.relatedCollection}`);
                console.log(`  Relation Type: ${attr.relationType}`);
                console.log(`  Two Way: ${attr.twoWay}`);
            }
        });

        // Inspect avisos_comunidad
        console.log('\n-----------------------------------\n');
        console.log('Fetching attributes for avisos_comunidad...');
        const avisosCollection = collections.collections.find(c => c.name === 'avisos_comunidad' || c.name === 'Avisos Comunidad' || c.name === 'avisos');

        if (avisosCollection) {
            console.log(`Inspecting collection: ${avisosCollection.name} (${avisosCollection.$id})`);
            const avisosAttributes = await databases.listAttributes(databaseId, avisosCollection.$id);
            console.log('Attributes:');
            avisosAttributes.attributes.forEach(attr => {
                console.log(`- ${attr.key} (${attr.type}) ${attr.required ? '[REQUIRED]' : ''} ${attr.status ? '- ' + attr.status : ''}`);
                if (attr.type === 'relationship') {
                    console.log(`  Related Collection: ${attr.relatedCollection}`);
                    console.log(`  Relation Type: ${attr.relationType}`);
                    console.log(`  Two Way: ${attr.twoWay}`);
                }
            });
        } else {
            console.log('Collection avisos_comunidad not found');
        }

    } catch (error) {
        console.error('Error inspecting schema:', error);
    }
}

inspectSchema();
