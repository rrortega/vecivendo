import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

async function inspect() {
    try {
        console.log("Checking collections...");
        const collections = await databases.listCollections(dbId);
        const gruposCol = collections.collections.find(c => c.name === 'Grupos WhatsApp' || c.$id === 'grupos_whatsapp');

        if (gruposCol) {
            console.log("Collection 'grupos_whatsapp' found:", gruposCol.$id);
        } else {
            console.log("Collection 'grupos_whatsapp' NOT found.");
        }

        console.log("Checking attributes of 'residenciales'...");
        const attrs = await databases.listAttributes(dbId, 'residenciales');
        const gruposAttr = attrs.attributes.find(a => a.key === 'grupos_whatsapp');

        if (gruposAttr) {
            console.log("Attribute 'grupos_whatsapp' found in 'residenciales':", gruposAttr);
        } else {
            console.log("Attribute 'grupos_whatsapp' NOT found in 'residenciales'.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

inspect();
