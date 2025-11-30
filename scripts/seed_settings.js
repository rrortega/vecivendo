require('dotenv').config({ path: '.env.local' });
const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const COLLECTION_ID = 'configuraciones';

async function seedSettings() {
    try {
        console.log('Seeding System Settings...');

        const settingsData = {
            clave: "whatsapp_soporte",
            valor: "5215555555555", // Example number
            descripcion: "Número de WhatsApp para atención al cliente y altas de residenciales"
        };

        // Check if collection exists (by trying to list docs), if not we might fail if we don't create it.
        // Assuming collection exists or we just try to create doc.
        // For this task, I'll assume the user/admin creates the collection structure:
        // Collection: configuraciones
        // Attributes: clave (string, unique), valor (string), descripcion (string)

        const existing = await databases.listDocuments(
            DB_ID,
            COLLECTION_ID,
            []
        );

        const match = existing.documents.find(d => d.clave === settingsData.clave);

        if (match) {
            console.log(`Updating existing setting: ${match.$id}`);
            await databases.updateDocument(
                DB_ID,
                COLLECTION_ID,
                match.$id,
                settingsData
            );
        } else {
            console.log('Creating new setting...');
            await databases.createDocument(
                DB_ID,
                COLLECTION_ID,
                ID.unique(),
                settingsData
            );
        }

        console.log('Done!');
    } catch (error) {
        console.error('Error seeding settings:', error);
        console.log('Ensure "configuraciones" collection exists with attributes: clave (string), valor (string), descripcion (string)');
    }
}

seedSettings();
