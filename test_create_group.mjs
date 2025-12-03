
import 'dotenv/config';
import { Client, Databases, ID } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

async function testCreateGroup() {
    try {
        console.log("1. Creating NEW Residential...");
        const resPayload = {
            nombre: "Test Res " + Date.now(),
            slug: "test-res-" + Date.now(),
            ubicacion_centro_lat: 0,
            ubicacion_centro_lng: 0,
            radio_autorizado_metros: 100
        };
        const res = await databases.createDocument(dbId, 'residenciales', ID.unique(), resPayload);
        console.log("✅ Residential created:", res.$id);

        console.log("2. Creating Group linked to NEW Residential...");
        try {
            const group = await databases.createDocument(dbId, 'grupos_whatsapp', ID.unique(), {
                nombre_grupo: "Test Group " + Date.now(),
                whatsapp_group_id: "123",
                residencial: res.$id
            });
            console.log("✅ Group created linked to residential:", group.$id);

            // Cleanup group
            await databases.deleteDocument(dbId, 'grupos_whatsapp', group.$id);
            console.log("✅ Group deleted.");

        } catch (e) {
            console.error("❌ Group creation failed:", e.message);
            console.error("Details:", e);
        }

        // Cleanup residential
        console.log("Cleaning up residential...");
        await databases.deleteDocument(dbId, 'residenciales', res.$id);
        console.log("✅ Residential deleted.");

    } catch (e) {
        console.error("❌ Error:", e);
    }
}

testCreateGroup();
