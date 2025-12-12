
const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://aw.chamba.pro/v1')
    .setProject('692786a2002bfd4c58a6')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";
const adsCollectionId = "anuncios";

async function addAttribute() {
    try {
        console.log("Adding 'categoria_slug' attribute...");
        await databases.createStringAttribute(
            dbId,
            adsCollectionId,
            "categoria_slug",
            255, // data size
            false // required? No, because we have existing docs without it. We'll fill it.
        );
        console.log("Attribute creation initiated. It may take a moment to be available.");

        // Polling to check if available?
        // Usually takes a few seconds. We'll just wait a bit in the execution flow.
    } catch (error) {
        console.error("Error adding attribute:", error);
    }
}

addAttribute();
