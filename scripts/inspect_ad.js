const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const collectionId = 'anuncios';
const adId = '692f4a1c00197880bbbd';

async function inspectAd() {
    try {
        const ad = await databases.getDocument(dbId, collectionId, adId);
        console.log("Ad Variants:", ad.variants);
        if (ad.variants && ad.variants.length > 0) {
            ad.variants.forEach((v, i) => {
                try {
                    console.log(`Variant ${i}:`, JSON.parse(atob(v)));
                } catch (e) {
                    console.log(`Variant ${i} (raw):`, v);
                }
            });
        }
    } catch (error) {
        console.error("Error inspecting ad:", error);
    }
}

inspectAd();
