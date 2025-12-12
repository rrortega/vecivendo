
const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://aw.chamba.pro/v1')
    .setProject('692786a2002bfd4c58a6');

const databases = new Databases(client);
const dbId = "vecivendo-db";

async function inspectAds() {
    try {
        const response = await databases.listDocuments(
            dbId,
            "anuncios",
            [
                // Query.limit(5)
            ]
        );

        console.log(`Found ${response.documents.length} ads. Inspecting first 5:`);

        response.documents.slice(0, 5).forEach(doc => {
            console.log(`ID: ${doc.$id}`);
            console.log(`  Title: ${doc.titulo}`);
            console.log(`  Category (categoria): ${JSON.stringify(doc.categoria)}`);
            console.log(`  Category Slug (categoria_slug): ${JSON.stringify(doc.categoria_slug)}`);
            console.log("---");
        });
    } catch (error) {
        console.error("Error inspecting ads:", error);
    }
}

inspectAds();
