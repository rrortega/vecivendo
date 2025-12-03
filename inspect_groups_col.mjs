
import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

async function inspectGroups() {
    try {
        console.log("Listing collections...");
        const collections = await databases.listCollections(dbId);
        const gruposCol = collections.collections.find(c => c.name === 'Grupos WhatsApp' || c.$id === 'grupos_whatsapp');

        if (!gruposCol) {
            console.log("Collection 'grupos_whatsapp' NOT found.");
            return;
        }

        console.log("Collection 'grupos_whatsapp' found:", gruposCol);

        console.log("Checking attributes of 'grupos_whatsapp'...");
        const attrs = await databases.listAttributes(dbId, gruposCol.$id);
        console.log("Attributes:", attrs.attributes.map(a => ({ key: a.key, type: a.type, required: a.required })));

        const residencialAttr = attrs.attributes.find(a => a.key === 'residencial');
        if (residencialAttr) {
            console.log("Attribute 'residencial' details:", residencialAttr);
        } else {
            console.log("Attribute 'residencial' NOT found in 'grupos_whatsapp'.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

inspectGroups();
