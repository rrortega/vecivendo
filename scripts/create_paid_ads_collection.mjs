import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionName = 'anuncios_pago';

async function createPaidAdsCollection() {
    try {
        console.log(`Creating collection '${collectionName}'...`);

        // 1. Create Collection
        const collection = await databases.createCollection(
            dbId,
            collectionName,
            collectionName,
            [
                Permission.read(Role.any()), // Public read
                Permission.write(Role.users()), // Authenticated users write (adjust as needed)
            ]
        );
        console.log(`Collection created with ID: ${collection.$id}`);

        // 2. Create Attributes
        console.log('Creating attributes...');

        await databases.createStringAttribute(dbId, collection.$id, 'titulo', 100, true);
        await databases.createUrlAttribute(dbId, collection.$id, 'imagen_url', true);
        await databases.createUrlAttribute(dbId, collection.$id, 'link_destino', true);
        await databases.createDatetimeAttribute(dbId, collection.$id, 'fecha_inicio', true);
        await databases.createDatetimeAttribute(dbId, collection.$id, 'fecha_fin', true);
        await databases.createBooleanAttribute(dbId, collection.$id, 'activo', true); // Required, no default
        await databases.createStringAttribute(dbId, collection.$id, 'porcentaje_descuento', 20, false); // Optional

        console.log('Attributes created successfully.');
        console.log('Waiting for attributes to be processed...');

        // Wait a bit before creating dummy data
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. Create Dummy Data
        console.log('Creating dummy data...');
        await databases.createDocument(
            dbId,
            collection.$id,
            'promo_clearance',
            {
                titulo: 'Liquidación de Temporada',
                imagen_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
                link_destino: 'https://vecivendo.com/promociones',
                fecha_inicio: new Date().toISOString(),
                fecha_fin: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
                activo: true,
                porcentaje_descuento: 'Hasta 50%'
            }
        );

        console.log('Dummy data created.');
        console.log('Done!');

    } catch (error) {
        console.error('Error:', error);
    }
}

createPaidAdsCollection();
