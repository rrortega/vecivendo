
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const residentialsCol = 'residenciales';
const adsCol = 'anuncios';

async function recalculateRes() {
    console.log('Recalculating residential metrics...');

    // 1. Fetch all Residentials
    let allRes = [];
    let offset = 0;
    while (true) {
        const res = await databases.listDocuments(dbId, residentialsCol, [
            Query.limit(100),
            Query.offset(offset)
        ]);
        allRes = allRes.concat(res.documents);
        if (res.documents.length < 100) break;
        offset += 100;
    }
    console.log(`Found ${allRes.length} residentials.`);

    // 2. Update each
    for (const res of allRes) {
        try {
            // Fetch All Active Ads
            const total = await databases.listDocuments(dbId, adsCol, [
                Query.equal('residencial', res.$id),
                Query.equal('activo', true),
                Query.limit(5000)
            ]);

            const docs = total.documents;
            const paidPlans = ['pago', 'premium', 'pro', 'paid'];
            const countPaid = docs.filter(doc => doc.plan && paidPlans.includes(doc.plan)).length;
            const countTotal = total.total; // Total active from Query (might be more than docs if limit hit, but 5000 is safe)
            const countFree = Math.max(0, countTotal - countPaid);

            console.log(`Res ${res.nombre}: Free ${countFree}, Paid ${countPaid}`);

            await databases.updateDocument(dbId, residentialsCol, res.$id, {
                total_anuncios_gratis: countFree,
                total_anuncios_pago: countPaid
            });

        } catch (e) {
            console.error(`Error processing residential ${res.$id}:`, e.message);
        }
    }
    console.log('Done.');
}
recalculateRes();
