// delete_duplicate_residencial.mjs
import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";
const duplicateId = "6927f1bb001e06d7f44f";

async function main() {
    console.log(`Deleting duplicate residencial ${duplicateId}...`);
    try {
        await databases.deleteDocument(dbId, "residenciales", duplicateId);
        console.log("Deleted successfully.");
    } catch (e) {
        console.error("Error deleting:", e.message);
    }
}

main().catch(console.error);
