const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'anuncios';
const adId = '692f49450010c2416778'; // ID from previous test

async function addVariant() {
    try {
        const variant = {
            type: "Paquete Test",
            price: 999,
            minQuantity: 5,
            sku: "TEST-SKU"
        };

        // Base64 encode the variant JSON
        const variantString = btoa(JSON.stringify(variant));

        await databases.updateDocument(dbId, collectionId, adId, {
            variants: [variantString]
        });

        console.log("Variant added successfully to ad:", adId);
    } catch (error) {
        console.error("Error adding variant:", error);
    }
}

addVariant();
