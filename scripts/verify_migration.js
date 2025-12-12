
const { Client, Databases, Query } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://aw.chamba.pro/v1')
    .setProject('692786a2002bfd4c58a6')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";
const adsCollectionId = "anuncios";

async function verify() {
    try {
        console.log("Verifying ads have 'categoria_slug'...");
        const response = await databases.listDocuments(
            dbId,
            adsCollectionId,
            [Query.limit(100), Query.select(["$id", "titulo", "categoria", "categoria_slug"])]
        );

        let valid = 0;
        let invalid = 0;

        response.documents.forEach(doc => {
            if (doc.categoria_slug) {
                valid++;
            } else {
                console.warn(`Ad ${doc.$id} ('${doc.titulo}') missing slug! Category: '${doc.categoria}'`);
                invalid++;
            }
        });

        console.log(`Verification result: ${valid} valid, ${invalid} invalid.`);

    } catch (error) {
        console.error("Verification failed:", error);
    }
}

verify();
