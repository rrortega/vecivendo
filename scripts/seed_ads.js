require('dotenv').config({ path: '.env.local' });
const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const COLLECTION_ID = 'anuncios_pago';

async function seedAds() {
    try {
        console.log('Checking attributes...');
        const attrs = await databases.listAttributes(DB_ID, COLLECTION_ID);
        console.log('Attributes:', attrs.attributes.map(a => a.key));

        console.log('Seeding paid ads...');

        // 1. Get an existing ad for internal link
        const ads = await databases.listDocuments(DB_ID, 'anuncios', []);
        const internalAdId = ads.documents.length > 0 ? ads.documents[0].$id : 'no-ad-found';
        const residencialId = ads.documents.length > 0 ? ads.documents[0].residencial_id : 'residencial-demo';

        const adsToCreate = [
            {
                titulo: 'Tu Publicidad Aquí (Google)',
                imagen_url: 'https://cloud.appwrite.io/v1/storage/buckets/6746961a001d93616600/files/674697e700201d84878a/view?project=67469396000c0b89381c&mode=admin', // Placeholder image
                link_destino: 'https://google.com',
                fecha_inicio: new Date().toISOString(),
                fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days
            },
            {
                titulo: 'Oferta Especial Vecina',
                imagen_url: 'https://cloud.appwrite.io/v1/storage/buckets/6746961a001d93616600/files/674697e700201d84878a/view?project=67469396000c0b89381c&mode=admin',
                link_destino: `http://localhost:3000/${residencialId}/anuncio/${internalAdId}`,
                fecha_inicio: new Date().toISOString(),
                fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        for (const ad of adsToCreate) {
            await databases.createDocument(
                DB_ID,
                COLLECTION_ID,
                ID.unique(),
                ad
            );
            console.log(`Created ad: ${ad.titulo}`);
        }

        console.log('Done!');

    } catch (error) {
        console.error('Error seeding ads:', error);
    }
}

seedAds();
