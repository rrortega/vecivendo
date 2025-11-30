// check_residenciales.mjs
import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";

async function main() {
    console.log("Listing all residenciales...");
    const resList = await databases.listDocuments(dbId, "residenciales");
    console.log(`Found ${resList.total} residenciales:`);
    resList.documents.forEach(doc => {
        console.log(`- ID: ${doc.$id}, Name: ${doc.nombre}, Slug: ${doc.slug}`);
    });
}

main().catch(console.error);
