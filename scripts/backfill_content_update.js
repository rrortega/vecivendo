
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'anuncios';

async function backfill() {
    console.log('Backfilling fecha_actualizacion...');
    let count = 0;
    try {
        let response = await databases.listDocuments(dbId, collectionId, [
            Query.limit(100)
        ]);

        let documents = response.documents;

        // Simple pagination handled by updating docs (which might move them out of query if filtered, but we are fetching all)
        // With limit 100, we might need a loop if > 100.
        // But since we are modifying them, we can just fetch until we process all.
        // Actually, listing without filter just gives first 100.
        // We will loop with offset.

        let total = response.total;
        console.log(`Found ${total} documents.`);

        let offset = 0;

        while (offset < total) {
            if (offset > 0) {
                response = await databases.listDocuments(dbId, collectionId, [
                    Query.limit(100),
                    Query.offset(offset)
                ]);
                documents = response.documents;
            }

            for (const doc of documents) {
                // If already has it, skip (optional, but good for re-runs)
                // However, we want to ensure it matches $updatedAt for now to fix the current order.
                // Or $createdAt if we want to reset to "original" order?
                // The issue is $updatedAt is corrupted by metric updates.
                // But we don't know *when* the last content update was vs metric update.
                // Best effort: set it to $updatedAt. Going forward it will be correct.

                if (!doc.fecha_actualizacion) {
                    await databases.updateDocument(dbId, collectionId, doc.$id, {
                        fecha_actualizacion: doc.$updatedAt // Initialize with current updated at
                    });
                    process.stdout.write('.');
                    count++;
                }
            }
            offset += 100;
        }

        console.log(`\nBackfilled ${count} documents.`);

    } catch (e) {
        console.error('Error backfilling:', e);
    }
}

backfill();
