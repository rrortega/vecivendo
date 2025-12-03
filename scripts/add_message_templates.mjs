import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const CONFIG_COLLECTION_ID = 'configuracion_global';

async function addMessageTemplateAttributes() {
    try {
        console.log('--- Agregando atributos de plantillas de mensajes ---');

        const createStringAttribute = async (key, size, required = false, defaultValue = null) => {
            try {
                await databases.createStringAttribute(
                    dbId,
                    CONFIG_COLLECTION_ID,
                    key,
                    size,
                    required,
                    defaultValue
                );
                console.log(`✅ Atributo '${key}' creado.`);
            } catch (e) {
                if (e.code === 409) {
                    console.log(`ℹ️ Atributo '${key}' ya existe.`);
                } else {
                    console.error(`❌ Error creando '${key}':`, e.message);
                }
            }
        };

        // Crear atributos para las plantillas de mensajes
        // Nombres cortos sin la palabra "plantilla"
        await createStringAttribute('msg_pedido', 2000, false, '');
        await createStringAttribute('msg_review', 1000, false, '');
        await createStringAttribute('msg_solicitud_residencial', 1000, false, '');
        await createStringAttribute('msg_compartir_anuncio', 500, false, '');

        console.log('\n⏳ Esperando 5 segundos para que los atributos se indexen...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('✅ Migración completada exitosamente.');

    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

addMessageTemplateAttributes();
