
import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

async function fixRelationship() {
    try {
        console.log("Fixing 'grupos_whatsapp' relationship in 'residenciales'...");

        // We want to update the relationship so that deleting a group does NOT delete the residential.
        // Currently it is 'cascade', which is dangerous/wrong for Parent side of One-To-Many.
        // We should change it to 'setNull' (remove from list) or 'restrict'.

        // updateRelationshipAttribute(databaseId, collectionId, key, [onDelete])
        // Note: The key is the attribute key in the collection we are updating.

        await databases.updateRelationshipAttribute(
            dbId,
            'residenciales',
            'grupos_whatsapp',
            'setNull' // onDelete behavior: setNull (removes the relation, doesn't delete parent)
        );

        console.log("✅ Relationship updated to 'setNull' in 'residenciales'.");

    } catch (e) {
        console.error("❌ Error updating relationship:", e);
    }
}

fixRelationship();
