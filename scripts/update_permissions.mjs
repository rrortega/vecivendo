// update_permissions.mjs
import 'dotenv/config';
import { Client, Databases, Permission, Role } from "node-appwrite";

const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";

const collections = [
    "residenciales",
    "anunciantes",
    "anuncios",
    "pedidos",
    "mensajes_whatsapp"
];

async function main() {
    console.log("Updating permissions for collections...");

    for (const colId of collections) {
        try {
            console.log(`Updating ${colId}...`);
            // Allow Any to read, but only specific roles to write (for now, we keep it simple)
            // In a real app, you'd be more restrictive.
            // For this demo/MVP, we need public read for the catalog.
            await databases.updateCollection(
                dbId,
                colId,
                colId, // Name (keeping same)
                [
                    Permission.read(Role.any()), // Public Read
                    Permission.write(Role.any()), // Public Write (for demo simplicity - e.g. orders)
                    Permission.update(Role.any()),
                    Permission.delete(Role.any())
                ]
            );
            console.log(`Updated ${colId}.`);
        } catch (e) {
            console.error(`Error updating ${colId}:`, e.message);
        }
    }
    console.log("Permissions updated.");
}

main().catch(console.error);
