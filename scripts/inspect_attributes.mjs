// inspect_attributes.mjs
import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";

async function main() {
    console.log("Inspecting attributes for 'anuncios'...");
    const attrs = await databases.listAttributes(dbId, "anuncios");
    const imgAttr = attrs.attributes.find(a => a.key === "imagenes");
    console.log("imagenes attribute:", imgAttr);
}

main().catch(console.error);
