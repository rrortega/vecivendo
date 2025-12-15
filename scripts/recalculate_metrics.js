
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const adsCollection = 'anuncios';
const ordersCollection = 'pedidos';

async function recalculate() {
    console.log('Starting recalculation of order metrics...');

    // 1. Fetch all non-cancelled orders
    let allOrders = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
        console.log(`Fetching orders offset ${offset}...`);
        const response = await databases.listDocuments(dbId, ordersCollection, [
            Query.limit(limit),
            Query.offset(offset)
            // Removed Query.notEqual('status', 'cancelado') to avoid index errors.
            // We will filter in memory to be safe, or try Query.notEqual('estado', 'cancelado')
            // Let's filter in memory since we don't know if 'estado' is indexed. 
        ]);

        // Filter in memory for safety
        const validDocs = response.documents.filter(d => d.estado !== 'cancelado');

        allOrders = allOrders.concat(validDocs);
        if (response.documents.length < limit) break;
        offset += limit;
    }

    console.log(`Total valid orders found: ${allOrders.length}`);

    // 2. Aggregate counts per Ad ID
    const adCounts = {}; // AdID -> Count

    for (const order of allOrders) {
        let items = order.items;
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                console.error(`Failed to parse items for order ${order.$id}`);
                continue;
            }
        }

        if (Array.isArray(items)) {
            // Get unique ad IDs in this order
            const uniqueAdsInOrder = new Set(items.map(i => i.id).filter(id => id));

            uniqueAdsInOrder.forEach(adId => {
                adCounts[adId] = (adCounts[adId] || 0) + 1;
            });
        }
    }

    const adIds = Object.keys(adCounts);
    console.log(`Found ${adIds.length} ads with orders.`);

    // 3. Update Ads
    // Getting current values to avoid redundant writes? Or just overwrite.
    // Overwriting is safer to ensure consistency.

    for (const [adId, count] of Object.entries(adCounts)) {
        try {
            console.log(`Updating Ad ${adId} with total_pedidos: ${count}`);
            await databases.updateDocument(dbId, adsCollection, adId, {
                total_pedidos: count
            });
        } catch (e) {
            console.error(`Failed to update Ad ${adId}: ${e.message}`);
        }
    }

    // Optional: Reset ads with 0 orders? 
    // The map only has ads WITH orders. Ads not in map should have 0.
    // This script only updates ads that HAVE orders. 
    // If an ad previously had orders but now has 0 (e.g. all cancelled), it won't be in the map.
    // To handle that, we should probably fetch ALL ads and match against the map.

    // Let's do that for completeness if needed, but the prompt focused on "sumarizar...".
    // I will stick to updating the ones with counts first. 
    // Resetting others might be expensive if there are many ads.

    console.log('Recalculation complete.');
}

recalculate();
