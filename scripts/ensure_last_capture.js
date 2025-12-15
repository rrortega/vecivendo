
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'anuncios';

async function ensureAttribute() {
    console.log('Ensuring last_capture attribute...');
    try {
        // Prepare to add attribute if missing, but we assume it exists based on user.
        // We will check index.
        try {
            await databases.createIndex(dbId, collectionId, 'idx_last_capture', 'key', ['last_capture'], ['DESC']);
            console.log('Created index idx_last_capture');
        } catch (e) {
            console.log('Index error (likely exists):', e.message);
        }

        // Backfill just in case it is empty on some docs, defaulting to $updatedAt
        console.log('Backfilling empty last_capture...');
        let offset = 0;
        let total = 0;

        do {
            const response = await databases.listDocuments(dbId, collectionId, [
                Query.limit(100),
                Query.offset(offset)
            ]);
            total = response.total;

            for (const doc of response.documents) {
                if (!doc.last_capture) {
                    await databases.updateDocument(dbId, collectionId, doc.$id, {
                        last_capture: doc.$updatedAt
                    });
                    process.stdout.write('.');
                }
            }
            offset += 100;
        } while (offset < total);

        console.log('\nDone backfilling.');

        // Remove fecha_actualizacion
        try {
            await databases.deleteAttribute(dbId, collectionId, 'fecha_actualizacion');
            console.log('Deleted fecha_actualizacion attribute');
        } catch (e) {
            console.log('Error deleting fecha_actualizacion:', e.message);
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

ensureAttribute();
