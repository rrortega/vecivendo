// seed_data.mjs
import 'dotenv/config';
import { Client, Databases, ID } from "node-appwrite";

const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = "vecivendo-db";

const categories = ["Comida", "Servicios", "Tecnología", "Hogar", "Ropa", "Mascotas", "Juguetes", "Deportes", "Vehículos", "Inmuebles"];
const types = ["producto", "servicio"];

async function main() {
    console.log("Starting seed data generation...");

    // 1. Create Residencial
    console.log("Creating Residencial...");
    let residencialId;
    try {
        const residencial = await databases.createDocument(
            dbId,
            "residenciales",
            ID.unique(),
            {
                nombre: "Residencial Demo",
                slug: "residencial-demo",
                whatsapp_group_id: "123456789",
                ubicacion_centro_lat: 19.432608,
                ubicacion_centro_lng: -99.133209,
                radio_autorizado_metros: 5000
            }
        );
        residencialId = residencial.$id;
        console.log(`Residencial created: ${residencialId}`);
    } catch (error) {
        console.error("Error creating residencial:", error.message);
        // Try to fetch existing if create fails (for idempotency in repeated runs)
        const resList = await databases.listDocuments(dbId, "residenciales");
        if (resList.documents.length > 0) {
            residencialId = resList.documents[0].$id;
            console.log(`Using existing residencial: ${residencialId}`);
        } else {
            throw error;
        }
    }

    // 2. Create Advertisers and Ads
    console.log("Creating Advertisers and Ads...");
    for (let i = 0; i < 10; i++) {
        const category = categories[i % categories.length];
        const type = types[i % 2]; // Alternate between product and service

        // Create Advertiser
        const advertiserName = `Anunciante ${i + 1}`;
        const phone = `+5255${Math.floor(10000000 + Math.random() * 90000000)}`;

        let advertiserId;
        try {
            const advertiser = await databases.createDocument(
                dbId,
                "anunciantes",
                ID.unique(),
                {
                    telefono_whatsapp: phone,
                    nombre_anunciante: advertiserName,
                    residencial_id: residencialId,
                    ultima_actividad: new Date().toISOString()
                }
            );
            advertiserId = advertiser.$id;
            console.log(`  Advertiser ${i + 1} created: ${advertiserId}`);
        } catch (error) {
            console.error(`  Error creating advertiser ${i + 1}:`, error.message);
            continue;
        }

        // Create Ad
        const adTitle = `${category} - Oferta ${i + 1}`;
        const adDesc = `Descripción increíble para ${adTitle}. ¡Aprovecha esta oportunidad única!`;
        const price = (Math.random() * 1000).toFixed(2);

        try {
            const ad = await databases.createDocument(
                dbId,
                "anuncios",
                ID.unique(),
                {
                    residencial_id: residencialId,
                    anunciante_id: advertiserId,
                    mensaje_original_id: `msg_${Date.now()}_${i}`,
                    titulo: adTitle,
                    descripcion: adDesc,
                    precio: parseFloat(price),
                    moneda: "MXN",
                    categoria: category,
                    tipo: type,
                    imagenes: [], // Empty array for now
                    fecha_publicacion: new Date().toISOString(),
                    activo: true,
                    metadata_ia: JSON.stringify({ keywords: [category, "oferta", "vecivendo"] })
                }
            );
            console.log(`    Ad ${i + 1} created: ${ad.$id} (${adTitle})`);
        } catch (error) {
            console.error(`    Error creating ad ${i + 1}:`, error.message);
        }
    }

    console.log("Seed data generation completed.");
}

main().catch(console.error);
