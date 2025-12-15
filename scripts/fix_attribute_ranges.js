
const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'anuncios';

async function fixAttributes() {
    const attributesFn = [
        { key: 'vistas', min: 0, max: 2147483647, default: 0 },
        { key: 'clicks', min: 0, max: 2147483647, default: 0 },
        { key: 'total_pedidos', min: 0, max: 2147483647, default: 0 },
        { key: 'total_reviews', min: 0, max: 2147483647, default: 0 }
    ];

    for (const attr of attributesFn) {
        try {
            console.log(`Updating ${attr.key}...`);
            // updateIntegerAttribute(databaseId, collectionId, key, required, min, max, default)
            await databases.updateIntegerAttribute(
                dbId,
                collectionId,
                attr.key,
                false, // required
                attr.min,
                attr.max,
                attr.default
            );
            console.log(`Updated ${attr.key} successfully.`);
        } catch (e) {
            console.error(`Failed to update ${attr.key}:`, e.message);
        }
    }

    try {
        console.log('Updating valoracion_promedio...');
        // updateFloatAttribute(databaseId, collectionId, key, required, min, max, default)
        await databases.updateFloatAttribute(
            dbId,
            collectionId,
            'valoracion_promedio',
            false,
            0.0,
            5.0,
            0.0
        );
        console.log('Updated valoracion_promedio successfully.');
    } catch (e) {
        console.error('Failed to update valoracion_promedio:', e.message);
    }
}

fixAttributes();
