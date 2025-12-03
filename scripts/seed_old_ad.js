require('dotenv').config({ path: '.env.local' });
const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const COLLECTION_ID = 'anuncios';

async function seedOldAd() {
    try {
        console.log('Seeding old ad...');

        // Create an ad published 10 days ago

        const ad = {
            titulo: 'Anuncio Antiguo de Prueba',
            descripcion: 'Este es un anuncio creado hace 10 días para probar la lógica de expiración.',
            precio: 50000,
            moneda: 'COP',
            categoria: 'Otros',
            activo: true,
            residencial_id: 'residencial-demo', // Assuming this exists or is a string
            anunciante_id: 'user-demo' // Placeholder
        };

        const result = await databases.createDocument(
            DB_ID,
            COLLECTION_ID,
            ID.unique(),
            ad
        );

        console.log(`Created old ad: ${result.$id}`);
        console.log(`URL: http://localhost:3000/residencial-demo/anuncio/${result.$id}`);

    } catch (error) {
        console.error('Error seeding old ad:', error);
    }
}

seedOldAd();
