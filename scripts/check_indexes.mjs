import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";

async function main() {
    console.log("Listing indexes for 'anuncios'...");
    try {
        const indexes = await databases.listIndexes(dbId, "anuncios");
        console.log(JSON.stringify(indexes, null, 2));
    } catch (error) {
        console.error("Error listing indexes:", error);
    }
}

main().catch(console.error);
