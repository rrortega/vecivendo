
import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

async function cleanup() {
    try {
        console.log("Deleting 'test_groups_rel' attribute from 'residenciales'...");
        try {
            await databases.deleteAttribute(dbId, 'residenciales', 'test_groups_rel');
            console.log("✅ Attribute 'test_groups_rel' deleted.");
        } catch (e) {
            console.error("⚠️ Error deleting attribute (might not exist):", e.message);
        }

        // Wait a bit for attribute deletion to propagate before deleting collection? 
        // Actually, deleting collection might fail if attribute still refers to it? 
        // Or deleting attribute might take time.
        console.log("Waiting 2 seconds...");
        await new Promise(r => setTimeout(r, 2000));

        console.log("Deleting 'test_groups' collection...");
        try {
            // Need ID of test_groups. I saw it was 692e8bb9003603b72ed9
            // But let's find it dynamically to be safe
            const cols = await databases.listCollections(dbId);
            const testCol = cols.collections.find(c => c.name === 'test_groups');
            if (testCol) {
                await databases.deleteCollection(dbId, testCol.$id);
                console.log(`✅ Collection 'test_groups' (${testCol.$id}) deleted.`);
            } else {
                console.log("⚠️ 'test_groups' collection not found.");
            }
        } catch (e) {
            console.error("❌ Error deleting collection:", e.message);
        }

    } catch (e) {
        console.error("❌ Error:", e);
    }
}

cleanup();
