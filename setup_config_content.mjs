import { Client, Databases, Permission, Role, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

const CONFIG_COLLECTION_ID = 'configuracion_global';
const CONTENT_COLLECTION_ID = 'contenidos';

async function setupCollections() {
    try {
        // --- 1. Setup Global Configuration Collection ---
        console.log('--- Setting up Global Configuration ---');
        try {
            await databases.getCollection(dbId, CONFIG_COLLECTION_ID);
            console.log('✅ Collection configuracion_global already exists.');
        } catch (error) {
            if (error.code === 404) {
                console.log('Creating configuracion_global collection...');
                await databases.createCollection(
                    dbId,
                    CONFIG_COLLECTION_ID,
                    'Configuración Global',
                    [
                        Permission.read(Role.any()),
                        Permission.write(Role.team('admins')),
                        Permission.update(Role.team('admins')),
                    ]
                );
                console.log('✅ Collection configuracion_global created.');
            } else throw error;
        }

        // Attributes for Config
        const createConfigString = async (key, size, required, def) => {
            try {
                await databases.createStringAttribute(dbId, CONFIG_COLLECTION_ID, key, size, required, def);
                console.log(`✅ Attribute '${key}' created.`);
            } catch (e) {
                if (e.code === 409) console.log(`ℹ️ Attribute '${key}' already exists.`);
                else console.error(`❌ Error creating '${key}':`, e.message);
            }
        };

        await createConfigString('whatsapp_asistencia', 20, true);
        await createConfigString('email_soporte', 100, true);
        await createConfigString('facebook_link', 255, false);
        await createConfigString('instagram_link', 255, false);
        await createConfigString('twitter_link', 255, false);
        await createConfigString('linkedin_link', 255, false);

        // Seed Config Data (if empty)
        console.log('Seeding config data...');
        const configDocs = await databases.listDocuments(dbId, CONFIG_COLLECTION_ID);
        if (configDocs.total === 0) {
            await databases.createDocument(dbId, CONFIG_COLLECTION_ID, ID.unique(), {
                whatsapp_asistencia: '5215555555555',
                email_soporte: 'soporte@vecivendo.com',
                facebook_link: 'https://facebook.com/vecivendo',
                instagram_link: 'https://instagram.com/vecivendo',
                twitter_link: 'https://twitter.com/vecivendo',
                linkedin_link: 'https://linkedin.com/company/vecivendo'
            });
            console.log('✅ Config data seeded.');
        } else {
            console.log('ℹ️ Config data already exists.');
        }


        // --- 2. Setup Contents Collection ---
        console.log('\n--- Setting up Contents ---');
        try {
            await databases.getCollection(dbId, CONTENT_COLLECTION_ID);
            console.log('✅ Collection contenidos already exists.');
        } catch (error) {
            if (error.code === 404) {
                console.log('Creating contenidos collection...');
                await databases.createCollection(
                    dbId,
                    CONTENT_COLLECTION_ID,
                    'Contenidos',
                    [
                        Permission.read(Role.any()),
                        Permission.write(Role.team('admins')),
                        Permission.update(Role.team('admins')),
                    ]
                );
                console.log('✅ Collection contenidos created.');
            } else throw error;
        }

        // Attributes for Contents
        const createContentString = async (key, size, required, def) => {
            try {
                await databases.createStringAttribute(dbId, CONTENT_COLLECTION_ID, key, size, required, def);
                console.log(`✅ Attribute '${key}' created.`);
            } catch (e) {
                if (e.code === 409) console.log(`ℹ️ Attribute '${key}' already exists.`);
                else console.error(`❌ Error creating '${key}':`, e.message);
            }
        };
        const createContentEnum = async (key, elements, required, def) => {
            try {
                await databases.createEnumAttribute(dbId, CONTENT_COLLECTION_ID, key, elements, required, def);
                console.log(`✅ Attribute '${key}' created.`);
            } catch (e) {
                if (e.code === 409) console.log(`ℹ️ Attribute '${key}' already exists.`);
                else console.error(`❌ Error creating '${key}':`, e.message);
            }
        };
        const createContentUrl = async (key, required) => {
            try {
                await databases.createUrlAttribute(dbId, CONTENT_COLLECTION_ID, key, required);
                console.log(`✅ Attribute '${key}' created.`);
            } catch (e) {
                if (e.code === 409) console.log(`ℹ️ Attribute '${key}' already exists.`);
                else console.error(`❌ Error creating '${key}':`, e.message);
            }
        }

        await createContentString('titulo', 255, true);
        await createContentString('descripcion', 500, true);
        await createContentString('contenido_largo', 5000, true); // Text area
        await createContentUrl('foto_url', false);
        await createContentString('palabras_clave', 255, false); // Comma separated
        await createContentEnum('tipo_contenido', ['faqs', 'blog', 'help'], true);
        await createContentString('categoria', 100, false);

        // Seed FAQs (if empty)
        console.log('Seeding FAQs...');
        // Wait a bit for attributes to be ready (Appwrite async index creation)
        console.log('Waiting 5s for attributes to be indexed...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        const contentDocs = await databases.listDocuments(dbId, CONTENT_COLLECTION_ID);
        if (contentDocs.total === 0) {
            const faqs = [
                {
                    titulo: "¿Qué es Vecivendo?",
                    descripcion: "Explicación breve sobre la plataforma.",
                    contenido_largo: "Vecivendo es una plataforma gratuita diseñada para conectar comunidades residenciales, facilitando el comercio local seguro entre vecinos y mejorando la comunicación dentro de tu residencial.",
                    tipo_contenido: "faqs",
                    categoria: "General"
                },
                {
                    titulo: "¿Tiene algún costo usar Vecivendo?",
                    descripcion: "Información sobre precios.",
                    contenido_largo: "No, Vecivendo es 100% gratuito para las comunidades y los vecinos. Nuestro objetivo es fomentar la economía local sin barreras de entrada.",
                    tipo_contenido: "faqs",
                    categoria: "Precios"
                },
                {
                    titulo: "¿Cómo puedo registrar mi residencial?",
                    descripcion: "Pasos para dar de alta una comunidad.",
                    contenido_largo: "Puedes registrar tu residencial contactándonos a través del botón de WhatsApp en la página de inicio. Nuestro equipo te ayudará a configurar tu comunidad en minutos.",
                    tipo_contenido: "faqs",
                    categoria: "Registro"
                },
                {
                    titulo: "¿Es seguro comprar y vender en Vecivendo?",
                    descripcion: "Medidas de seguridad.",
                    contenido_largo: "Sí, Vecivendo es exclusivo para residentes verificados. Esto crea un entorno de confianza donde sabes que estás tratando con tus propios vecinos, reduciendo riesgos significativamente.",
                    tipo_contenido: "faqs",
                    categoria: "Seguridad"
                },
                {
                    titulo: "¿Puedo vender servicios además de productos?",
                    descripcion: "Tipos de ofertas permitidas.",
                    contenido_largo: "¡Claro que sí! Puedes ofrecer servicios profesionales, comida casera, productos de segunda mano o nuevos. Todo lo que pueda ser útil para tu comunidad es bienvenido.",
                    tipo_contenido: "faqs",
                    categoria: "Ventas"
                }
            ];

            for (const faq of faqs) {
                try {
                    await databases.createDocument(dbId, CONTENT_COLLECTION_ID, ID.unique(), faq);
                    console.log(`✅ FAQ '${faq.titulo}' created.`);
                } catch (e) {
                    console.error(`❌ Error creating FAQ '${faq.titulo}':`, e.message);
                }
            }
        } else {
            console.log('ℹ️ Content data already exists.');
        }

        console.log('✅ Setup complete.');

    } catch (error) {
        console.error('Setup failed:', error);
    }
}

setupCollections();
