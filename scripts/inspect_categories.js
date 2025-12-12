
const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://aw.chamba.pro/v1')
    .setProject('692786a2002bfd4c58a6');

const databases = new Databases(client);
const dbId = "vecivendo-db";

async function inspectCategories() {
    try {
        const response = await databases.listDocuments(
            dbId,
            "categorias",
            // [Query.limit(100)]
        );

        console.log(`Found ${response.documents.length} categories.`);
        response.documents.forEach(doc => {
            console.log(`Name: '${doc.nombre}' | Slug: '${doc.slug}'`);
        });
    } catch (error) {
        console.error("Error inspecting categories:", error);
    }
}

inspectCategories();
