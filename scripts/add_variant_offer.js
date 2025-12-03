const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'anuncios';
const adId = '692f4a1c00197880bbbd';

async function addVariantWithOffer() {
    try {
        // Fetch existing variants first to preserve them
        const ad = await databases.getDocument(dbId, collectionId, adId);
        const existingVariants = ad.variants || [];

        const newVariant = {
            type: "Paquete Oferta",
            price: 1500,
            minQuantity: 2,
            sku: "OFFER-SKU",
            offer: "¡Lleva 2 y obtén un 10% de descuento adicional en tu próximo servicio!"
        };

        const variantString = btoa(JSON.stringify(newVariant));

        // Append new variant
        const updatedVariants = [...existingVariants, variantString];

        await databases.updateDocument(dbId, collectionId, adId, {
            variants: updatedVariants
        });

        console.log("Variant with offer added successfully to ad:", adId);
    } catch (error) {
        console.error("Error adding variant with offer:", error);
    }
}

addVariantWithOffer();
