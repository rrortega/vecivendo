import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://aw.chamba.pro/v1')
    .setProject('692786a2002bfd4c58a6');

const databases = new Databases(client);
const dbId = 'vecivendo-db';
const slug = 'residencial-demo';

async function debug() {
    try {
        console.log(`Checking residential with slug: ${slug}`);
        const resDocs = await databases.listDocuments(
            dbId,
            'residenciales',
            [Query.equal('slug', slug)]
        );

        if (resDocs.documents.length === 0) {
            console.log('❌ No residential found with that slug.');
            return;
        }

        const residential = resDocs.documents[0];
        console.log(`✅ Residential found: ${residential.nombre} (ID: ${residential.$id})`);

        console.log(`Checking ads for residential_id: ${residential.$id}`);
        // const adsDocs = await databases.listDocuments(
        //     dbId,
        //     'anuncios_pago',
        //     [Query.equal('residencial_id', residential.$id)]
        // );

        console.log('Listing ALL ads to inspect structure...');
        const adsDocs = await databases.listDocuments(
            dbId,
            'anuncios_pago',
            [Query.limit(5)]
        );

        console.log(`Found ${adsDocs.documents.length} ads.`);
        adsDocs.documents.forEach(ad => {
            console.log(JSON.stringify(ad, null, 2));
        });

        if (adsDocs.documents.length === 0) {
            console.log('Checking ALL ads to see if any exist...');
            const allAds = await databases.listDocuments(
                dbId,
                'anuncios_pago',
                [Query.limit(5)]
            );
            console.log(`Total ads in system: ${allAds.documents.length}`);
            allAds.documents.forEach(ad => {
                console.log(`- ${ad.titulo} (ResID: ${ad.residencial_id})`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

debug();
