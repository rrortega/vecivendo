
import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
    const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const key = req.headers['x-appwrite-key'] ?? '';

    log(`Initializing Client with Endpoint: ${endpoint}, Project: ${projectId} `);

    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(key);

    const databases = new Databases(client);
    const DATABASE_ID = process.env.DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
    const ANUNCIOS_COLLECTION_ID = 'anuncios';
    const REVIEWS_COLLECTION_ID = 'reviews';

    try {
        const event = req.headers['x-appwrite-event'];

        // Debug logging
        log(`Req Keys: ${Object.keys(req).join(', ')} `);

        let payload = {};

        // Attempt to extract payload from body or payload property
        if (req.body) {
            log('Using req.body');
            payload = req.body;
            // If body is a string (e.g. raw JSON), parse it
            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                } catch (e) {
                    error(`JSON Parse Error(body): ${e.message} `);
                }
            }
        } else if (req.payload) {
            log('Using req.payload');
            payload = req.payload;
            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                } catch (e) {
                    error(`JSON Parse Error(payload): ${e.message} `);
                }
            }
        } else {
            log('No body or payload found in request object.');
        }

        log(`Resolved Payload: ${JSON.stringify(payload)} `);

        // If no event and no payload logic (Manual execution without correct data)
        if (!event) {
            return res.json({ message: 'Function executed manually. No event trigger detected.', payload });
        }

        if (!payload || !payload.$id) {
            log('Invalid payload structure: missing $id');
            // Don't return error immediately, maybe legacy structure? 
            // But for triggered events, it should be the document.
        } else {
            log(`Payload ID: ${payload.$id} `);
        }

        // Handle Logs (Views/Clicks)
        if (event.includes('logs.documents') && event.includes('create')) {
            // Logs collection fields - check exact naming in database
            const adId = payload.anuncioId || payload.anuncio_id; // Try both casings/styles
            const type = payload.type;

            if (!adId) {
                log('Skipping: No anuncioId in log payload');
                return res.json({ message: 'No anuncioId in log' });
            }

            if (type !== 'view' && type !== 'click') {
                log(`Skipping: Log type '${type}' ignored`);
                return res.json({ message: 'Log type ignored' });
            }

            const ad = await databases.getDocument(DATABASE_ID, ANUNCIOS_COLLECTION_ID, adId);

            let updates = {};
            if (type === 'view') {
                updates.vistas = (ad.vistas || 0) + 1;
            } else if (type === 'click') {
                updates.clicks = (ad.clicks || 0) + 1;
            }

            await databases.updateDocument(DATABASE_ID, ANUNCIOS_COLLECTION_ID, adId, updates);
            return res.json({ message: `Updated ad ${adId} ${type} count` });
        }

        // Handle Orders
        if (event.includes('pedidos.documents') && (event.includes('create') || event.includes('update'))) {
            // Check status is not 'cancelado' (though for recalculation we check all)
            // Actually, if status changed TO cancelado, we need to recalc too.
            // So we just proceed to recalculate for the involved ads.

            let items = payload.items;
            if (typeof items === 'string') {
                try {
                    items = JSON.parse(items);
                } catch (e) {
                    log(`Error parsing items in order ${payload.$id}: ${e.message}`);
                    items = [];
                }
            }

            if (!Array.isArray(items)) {
                return res.json({ message: 'Invalid items format in order' });
            }

            // Extract distinct Ad IDs from this order's items
            // Assuming item.id corresponds to anuncioId
            const adIds = [...new Set(items.map(item => item.id).filter(id => id))];

            if (adIds.length === 0) {
                return res.json({ message: 'No ad IDs found in order items' });
            }

            log(`Recalculating orders for Ads: ${adIds.join(', ')} based on advertiser phone: ${payload.anunciante_telefono}`);

            if (!payload.anunciante_telefono) {
                return res.json({ message: 'No anunciante_telefono in order, cannot group' });
            }

            // Fetch all non-cancelled orders for this advertiser
            // We can't query by items content easily, so we fetch by advertiser
            const advertiserOrders = await databases.listDocuments(DATABASE_ID, 'pedidos', [
                Query.equal('anunciante_telefono', payload.anunciante_telefono),
                Query.limit(5000) // Reasonable limit for an advertiser's history
            ]);

            log(`Found ${advertiserOrders.documents.length} orders for this advertiser.`);

            for (const adId of adIds) {
                let count = 0;

                for (const order of advertiserOrders.documents) {
                    if (order.estado === 'cancelado') continue;

                    let orderItems = order.items;
                    if (typeof orderItems === 'string') {
                        try {
                            orderItems = JSON.parse(orderItems);
                        } catch (e) {
                            continue;
                        }
                    }

                    if (Array.isArray(orderItems)) {
                        const hasAd = orderItems.some(item => item.id === adId);
                        if (hasAd) {
                            count++;
                        }
                    }
                }

                log(`Ad ${adId} total valid orders: ${count}`);

                // Update Ad
                try {
                    await databases.updateDocument(DATABASE_ID, ANUNCIOS_COLLECTION_ID, adId, {
                        total_pedidos: count
                    });
                } catch (e) {
                    error(`Failed to update ad ${adId}: ${e.message}`);
                }
            }

            return res.json({ message: `Updated order counts for ${adIds.length} ads` });
        }

        // Handle Reviews
        if (event.includes('reviews.documents') && event.includes('create')) {
            const adId = payload.anuncioId || payload.anuncio_id;

            if (!adId) {
                return res.json({ message: 'No anuncio_id in review' });
            }

            const reviews = await databases.listDocuments(DATABASE_ID, REVIEWS_COLLECTION_ID, [
                Query.equal('anuncio_id', adId),
                Query.limit(5000)
            ]);

            const totalReviews = reviews.documents.length;
            const sumRating = reviews.documents.reduce((sum, r) => sum + (r.puntuacion || 0), 0);
            const avgRating = totalReviews > 0 ? sumRating / totalReviews : 0;

            await databases.updateDocument(DATABASE_ID, ANUNCIOS_COLLECTION_ID, adId, {
                total_reviews: totalReviews,
                valoracion_promedio: avgRating
            });

            return res.json({ message: `Updated ad ${adId} reviews` });
        }

        // Handle Anuncios (Ads) Changes -> Update Residential Counts
        if (event.includes('anuncios.documents') && (event.includes('create') || event.includes('update') || event.includes('delete'))) {
            const residentialId = payload.residencial || payload.residencial_id; // Check schema
            // If delete, payload might be the deleted doc, so it should have the data.

            if (!residentialId) {
                return res.json({ message: 'No residential ID in ad event' });
            }

            // Fetch Counts
            // Assuming 'plan' attribute distinguishes free vs paid. 
            // If 'plan' is missing implies free.
            // Paid plans: 'pago', 'premium', 'pro'

            // Fetch All Active Ads for Residential
            // We filter by plan in memory to avoid needing a new index immediately.
            const allActiveAds = await databases.listDocuments(DATABASE_ID, ANUNCIOS_COLLECTION_ID, [
                Query.equal('residencial', residentialId),
                Query.equal('activo', true),
                Query.limit(5000) // Fetch all (or reasonable max)
            ]);

            const totalActive = allActiveAds.total; // This is total matched by query
            // But if we have pagination limit, we might miss some? 
            // 5000 is likely enough for a residential.

            const docs = allActiveAds.documents;
            const paidPlans = ['pago', 'premium', 'pro', 'paid'];
            const paidAdsCount = docs.filter(doc => doc.plan && paidPlans.includes(doc.plan)).length;
            const freeAdsCount = Math.max(0, totalActive - paidAdsCount);

            // Update Residential
            const RESIDENTIALS_COLLECTION_ID = 'residenciales';

            await databases.updateDocument(DATABASE_ID, RESIDENTIALS_COLLECTION_ID, residentialId, {
                total_anuncios_gratis: freeAdsCount,
                total_anuncios_pago: paidAdsCount
            });

            return res.json({
                message: `Updated residential ${residentialId} stats`,
                stats: { free: freeAdsCount, paid: paidAdsCount }
            });
        }

        return res.json({ message: 'Event handled but no matching logic found' });

    } catch (err) {
        error(err);
        return res.json({ error: err.message }, 500);
    }
};
