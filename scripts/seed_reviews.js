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
        const adId = ad.$id;

        if (!adId) {
            console.log('No ad ID found.');
            return;
        }

        const reviews = [
            {
                anuncio_id: adId,
                puntuacion: 5,
                comentario: 'Excelente servicio, muy rápido y amable.',
                autor_nombre: 'María G.'
            },
            {
                anuncio_id: adId,
                puntuacion: 4,
                comentario: 'Buen producto, pero la entrega demoró un poco.',
                autor_nombre: 'Carlos R.'
            },
            {
                anuncio_id: adId,
                puntuacion: 5,
                comentario: 'Totalmente recomendado, volveré a comprar.',
                autor_nombre: 'Ana P.'
            }
        ];

        for (const review of reviews) {
            await databases.createDocument(
                DB_ID,
                COLLECTION_ID,
                ID.unique(),
                review
            );
            console.log(`Created review by: ${review.autor_nombre} for ad: ${adId}`);
        }

        console.log('Done!');
    } catch (error) {
        console.error('Error seeding reviews:', error);
        console.log('Make sure "reviews" collection exists with attributes: anunciante_id, puntuacion, comentario, autor_nombre, fecha');
    }
}

seedReviews();
