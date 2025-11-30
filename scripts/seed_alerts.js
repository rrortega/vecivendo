require('dotenv').config({ path: '.env.local' });
const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const COLLECTION_ID = 'avisos_comunidad';

async function seedAlerts() {
    try {
        console.log('Seeding Community Alerts...');

        // 1. Get Residencial Demo ID
        const residentials = await databases.listDocuments(DB_ID, 'residenciales', []);
        const demoRes = residentials.documents.find(d => d.slug === 'residencial-demo');
        const demoResId = demoRes ? demoRes.$id : 'residencial-demo';

        const alerts = [
            {
                titulo: "⚠️ Mantenimiento de Tuberías",
                descripcion: "Se realizará mantenimiento en la red de agua potable el día Jueves de 10:00 AM a 2:00 PM. Por favor tomen sus precauciones.",
                residencial_id: demoResId,
                fecha_inicio: new Date().toISOString(),
                fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
                nivel: "critical"
            },
            {
                titulo: "🐶 Mascota Perdida: 'Firulais'",
                descripcion: "Se busca perro Golden Retriever, responde al nombre de Firulais. Visto por última vez en el parque central. Recompensa.",
                residencial_id: demoResId,
                fecha_inicio: new Date().toISOString(),
                fecha_fin: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 days
                nivel: "info"
            }
        ];

        for (const alert of alerts) {
            await databases.createDocument(
                DB_ID,
                COLLECTION_ID,
                ID.unique(),
                alert
            );
            console.log(`Created alert: ${alert.titulo}`);
        }

        console.log('Done!');

    } catch (error) {
        console.error('Error seeding alerts:', error);
        console.log('Ensure "avisos_comunidad" collection exists with attributes: titulo, descripcion, residencial_id, fecha_inicio, fecha_fin, nivel');
    }
}

seedAlerts();
