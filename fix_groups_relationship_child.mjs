
import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

async function fixChildRelationship() {
    try {
        console.log("Fixing 'residencial' relationship in 'grupos_whatsapp'...");

        // Update child side to setNull as well to test if cascade is the issue.
        await databases.updateRelationshipAttribute(
            dbId,
            'grupos_whatsapp',
            'residencial',
            'setNull'
        );

        console.log("✅ Relationship updated to 'setNull' in 'grupos_whatsapp'.");

    } catch (e) {
        console.error("❌ Error updating relationship:", e);
    }
}

fixChildRelationship();
