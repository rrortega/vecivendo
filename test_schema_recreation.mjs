
import 'dotenv/config';
import { Client, Databases, ID } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

async function testSchema() {
    try {
        console.log("Creating test collection 'test_groups'...");
        const col = await databases.createCollection(dbId, ID.unique(), 'test_groups');
        const colId = col.$id;
        console.log("Collection created:", colId);

        console.log("Adding attributes...");
        await databases.createStringAttribute(dbId, colId, 'nombre_grupo', 255, true);
        await databases.createStringAttribute(dbId, colId, 'whatsapp_group_id', 255, false);

        // Wait for attributes to be available
        console.log("Waiting for string attributes...");
        await new Promise(r => setTimeout(r, 2000));

        console.log("Adding relationship to 'residenciales'...");
        // OneToMany: Residential has many Groups. Group belongs to one Residential.
        // Side: Child (Group).
        await databases.createRelationshipAttribute(dbId, colId, 'residenciales', 'oneToMany', true, 'residencial', 'test_groups_rel', 'setNull');

        console.log("Waiting for relationship attribute...");
        await new Promise(r => setTimeout(r, 2000));

        console.log("Testing creation with relationship...");
        const resList = await databases.listDocuments(dbId, 'residenciales', []);
        const resId = resList.documents[0].$id;

        const doc = await databases.createDocument(dbId, colId, ID.unique(), {
            nombre_grupo: "Test Group",
            whatsapp_group_id: "123",
            residencial: resId
        });
        console.log("✅ Document created with relationship:", doc.$id);

        console.log("Cleaning up...");
        await databases.deleteCollection(dbId, colId);
        console.log("✅ Cleanup done.");

    } catch (e) {
        console.error("❌ Error:", e);
    }
}

testSchema();
