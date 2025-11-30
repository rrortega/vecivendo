require('dotenv').config({ path: '.env.local' });
const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const COLLECTION_ID = 'residenciales';

async function seedResidential() {
    try {
        console.log('Seeding Residential JDS6...');

        const residentialData = {
            nombre: "Residencial Demo",
            slug: "residencial-demo",
            ubicacion_centro_lat: 21.08264694485578,
            ubicacion_centro_lng: -86.88846368188682,
            radio_autorizado_metros: 1609, // 1 mile
            whatsapp_group_id: "123456789", // Mock ID
            moneda: "MXN"
        };

        // Check if it exists to update or create
        const existing = await databases.listDocuments(
            DB_ID,
            COLLECTION_ID,
            []
        );

        const match = existing.documents.find(d => d.slug === residentialData.slug);

        if (match) {
            console.log(`Updating existing residential: ${match.$id}`);
            await databases.updateDocument(
                DB_ID,
                COLLECTION_ID,
                match.$id,
                residentialData
            );
        } else {
            console.log('Creating new residential...');
            await databases.createDocument(
                DB_ID,
                COLLECTION_ID,
                ID.unique(),
                residentialData
            );
        }

        console.log('Done!');
    } catch (error) {
        console.error('Error seeding residential:', error);
        console.log('Ensure "residenciales" collection exists with attributes: nombre, slug, direccion, imagen_url, latitud (float), longitud (float), radio_metros (float)');
    }
}

seedResidential();
