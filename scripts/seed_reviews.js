require('dotenv').config({ path: '.env.local' });
const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const COLLECTION_ID = 'reviews'; // Assuming this collection exists

async function seedReviews() {
    try {
        console.log('Seeding reviews...');

        // Get an advertiser to link reviews to
        // We'll use the advertiser of the first ad found
        const ads = await databases.listDocuments(DB_ID, 'anuncios', []);

        if (ads.documents.length === 0) {
            console.log('No ads found to link reviews to.');
            return;
        }

        const ad = ads.documents[0];
        const advertiserId = typeof ad.anunciante_id === 'object' ? ad.anunciante_id.$id : ad.anunciante_id;

        if (!advertiserId) {
            console.log('No advertiser ID found.');
            return;
        }

        const reviews = [
            {
                anunciante_id: advertiserId,
                puntuacion: 5,
                comentario: 'Excelente servicio, muy rápido y amable.',
                autor_nombre: 'María G.',
                fecha: new Date().toISOString()
            },
            {
                anunciante_id: advertiserId,
                puntuacion: 4,
                comentario: 'Buen producto, pero la entrega demoró un poco.',
                autor_nombre: 'Carlos R.',
                fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                anunciante_id: advertiserId,
                puntuacion: 5,
                comentario: 'Totalmente recomendado, volveré a comprar.',
                autor_nombre: 'Ana P.',
                fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        for (const review of reviews) {
            // Try to create review. If collection doesn't exist, this will fail.
            // We assume collection 'reviews' exists as per requirements implies DB usage.
            await databases.createDocument(
                DB_ID,
                COLLECTION_ID,
                ID.unique(),
                review
            );
            console.log(`Created review by: ${review.autor_nombre}`);
        }

        console.log('Done!');
    } catch (error) {
        console.error('Error seeding reviews:', error);
        console.log('Make sure "reviews" collection exists with attributes: anunciante_id, puntuacion, comentario, autor_nombre, fecha');
    }
}

seedReviews();
