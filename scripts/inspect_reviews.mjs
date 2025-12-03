import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";

async function main() {
    console.log("Inspecting 'reviews' collection...");
    try {
        const attrs = await databases.listAttributes(dbId, "reviews");
        console.log("Attributes:", attrs.attributes.map(a => a.key));
    } catch (error) {
        console.error("Error inspecting reviews:", error.message);
    }
}

main().catch(console.error);
