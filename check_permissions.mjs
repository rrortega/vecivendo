
import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

async function check() {
    console.log("DB ID:", dbId);
    try {
        const db = await databases.get(dbId);
        console.log("✅ Database found:", db.name);

        console.log("Listing collections...");
        const cols = await databases.listCollections(dbId);
        console.log("Collections:", cols.collections.map(c => ({ id: c.$id, name: c.name })));

        const resCol = cols.collections.find(c => c.$id === 'residenciales');
        if (resCol) {
            console.log("✅ 'residenciales' collection found.");
            // Check permissions
            // Note: listCollections doesn't show full permissions usually, need getCollection
            const fullResCol = await databases.getCollection(dbId, 'residenciales');
            console.log("Permissions for 'residenciales':", fullResCol.$permissions);
        } else {
            console.error("❌ 'residenciales' collection NOT found.");
        }

        const groupsCol = cols.collections.find(c => c.$id === 'grupos_whatsapp');
        if (groupsCol) {
            console.log("✅ 'grupos_whatsapp' collection found.");
            const fullGroupsCol = await databases.getCollection(dbId, 'grupos_whatsapp');
            console.log("Permissions for 'grupos_whatsapp':", fullGroupsCol.$permissions);
        } else {
            console.error("❌ 'grupos_whatsapp' collection NOT found.");
        }

    } catch (e) {
        console.error("❌ Error:", e);
    }
}

check();
