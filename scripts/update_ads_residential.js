require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const ADS_COLLECTION_ID = 'anuncios';
const RESIDENTIALS_COLLECTION_ID = 'residenciales';

async function updateAds() {
    try {
        console.log('Fetching Residencial Demo...');
        const residentials = await databases.listDocuments(
            DB_ID,
            RESIDENTIALS_COLLECTION_ID,
            [] // Query to find by slug if possible, but list all is fine for now
        );

        const demoRes = residentials.documents.find(d => d.slug === 'residencial-demo');

        if (!demoRes) {
            console.error('Residencial Demo not found!');
            return;
        }

        console.log(`Found Residencial Demo: ${demoRes.$id}`);

        console.log('Fetching all ads...');
        const ads = await databases.listDocuments(
            DB_ID,
            ADS_COLLECTION_ID,
            []
        );

        console.log(`Found ${ads.documents.length} ads. Updating...`);

        for (const ad of ads.documents) {
            // Check if it needs update
            // Note: In Appwrite, relationships might be stored as ID strings or objects depending on SDK/version, 
            // but usually we update with the ID string.
            // If the field is 'residencial_id', we update it.
            // If it's a relationship, we might need to use the attribute name.
            // Based on previous context, it seems to be 'residencial_id'.

            // We'll try to update 'residencial_id' attribute.
            // If it's a relationship, this might fail if the attribute name is different (e.g. 'residencial').
            // Let's assume 'residencial_id' for now as per seed_ads.js

            try {
                await databases.updateDocument(
                    DB_ID,
                    ADS_COLLECTION_ID,
                    ad.$id,
                    {
                        residencial_id: demoRes.$id
                    }
                );
                console.log(`Updated ad ${ad.$id} to residential ${demoRes.$id}`);
            } catch (err) {
                console.error(`Failed to update ad ${ad.$id}:`, err.message);
            }
        }

        console.log('Done!');

    } catch (error) {
        console.error('Error updating ads:', error);
    }
}

updateAds();
