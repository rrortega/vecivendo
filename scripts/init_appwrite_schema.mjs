// init_appwrite_schema.mjs
// Script to create the required Appwrite database, collections, and attributes for Vecivendo.
// Requires environment variables:
//   NEXT_PUBLIC_APPWRITE_ENDPOINT
//   NEXT_PUBLIC_APPWRITE_PROJECT_ID
//   APPWRITE_API_KEY (with scopes: databases.write, collections.write, attributes.write)

import 'dotenv/config';
import { Client, Databases } from "node-appwrite";

// Initialize client
const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Helper to create a collection if it does not exist
async function ensureCollection(databaseId, collectionId, name) {
    try {
        await databases.getCollection(databaseId, collectionId);
        console.log(`Collection ${name} already exists`);
    } catch (e) {
        console.log(`Creating collection ${name}`);
        // Permissions: empty array for now (default)
        await databases.createCollection(databaseId, collectionId, name, []);
    }
}

// Helper to add an attribute if it does not exist
async function ensureAttribute(databaseId, collectionId, attrFn, ...args) {
    try {
        // Try to create; if it already exists Appwrite returns an error which we catch
        await attrFn(databaseId, collectionId, ...args);
        console.log(`Attribute created in ${collectionId}`);
    } catch (e) {
        // Assume attribute already exists
        console.log(`Attribute may already exist in ${collectionId}: ${e.message}`);
    }
}

async function main() {
    // 1️⃣ Create database (if not exists)
    const dbId = "vecivendo-db";
    try {
        await databases.get(dbId);
        console.log("Database already exists");
    } catch (e) {
        console.log("Creating database");
        await databases.create(dbId, "Vecivendo");
    }

    // 2️⃣ Collections definitions
    const collections = [
        { id: "residenciales", name: "Residenciales" },
        { id: "anunciantes", name: "Anunciantes" },
        { id: "anuncios", name: "Anuncios" },
        { id: "pedidos", name: "Pedidos" },
        { id: "mensajes_whatsapp", name: "Mensajes WhatsApp" },
        { id: "grupos_whatsapp", name: "Grupos WhatsApp" },
        { id: "avisos_comunidad", name: "Avisos Comunidad" },
        { id: "anuncios_pago", name: "Anuncios Pago" },
        { id: "contenidos", name: "Contenidos" },
        { id: "logs", name: "Logs" },
        { id: "reviews", name: "Reviews" },
    ];

    for (const col of collections) {
        await ensureCollection(dbId, col.id, col.name);
    }

    // 3️⃣ Attributes per collection

    // --- Residenciales ---
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "nombre", 255, true);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "slug", 255, true);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "whatsapp_group_id", 255, false); // Changed to false as it might not be available initially
    await ensureAttribute(dbId, "residenciales", databases.createFloatAttribute.bind(databases), "ubicacion_centro_lat", false);
    await ensureAttribute(dbId, "residenciales", databases.createFloatAttribute.bind(databases), "ubicacion_centro_lng", false);
    await ensureAttribute(dbId, "residenciales", databases.createIntegerAttribute.bind(databases), "radio_autorizado_metros", false);
    await ensureAttribute(dbId, "residenciales", databases.createUrlAttribute.bind(databases), "portada", false);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "direccion", 500, false);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "ciudad", 255, false);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "provincia_estado", 255, false);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "codigo_postal", 20, false);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "country", 10, false);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "moneda", 10, false);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "phone_prefix", 10, false);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "descripcion", 5000, false);
    await ensureAttribute(dbId, "residenciales", databases.createBooleanAttribute.bind(databases), "activo", false);

    // --- Anunciantes ---
    await ensureAttribute(dbId, "anunciantes", databases.createStringAttribute.bind(databases), "telefono_whatsapp", 255, true);
    await ensureAttribute(dbId, "anunciantes", databases.createStringAttribute.bind(databases), "nombre_anunciante", 255, false);
    await ensureAttribute(dbId, "anunciantes", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToOne", false, "residencial_id", null, "setNull");
    await ensureAttribute(dbId, "anunciantes", databases.createDatetimeAttribute.bind(databases), "ultima_actividad", false);

    // --- Anuncios ---
    await ensureAttribute(dbId, "anuncios", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToOne", false, "residencial_id", null, "setNull");
    await ensureAttribute(dbId, "anuncios", databases.createRelationshipAttribute.bind(databases), "anunciantes", "manyToOne", false, "anunciante_id", null, "setNull");
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "mensaje_original_id", 255, false);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "titulo", 255, true);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "descripcion", 5000, false);
    await ensureAttribute(dbId, "anuncios", databases.createFloatAttribute.bind(databases), "precio", false);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "moneda", 10, false);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "categoria", 255, false, undefined, true); // Array of strings
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "tipo", 20, false);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "imagenes", 255, false, undefined, true);
    await ensureAttribute(dbId, "anuncios", databases.createBooleanAttribute.bind(databases), "activo", false);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "metadata_ia", 5000, false);
    await ensureAttribute(dbId, "anuncios", databases.createBooleanAttribute.bind(databases), "destacado", false);
    await ensureAttribute(dbId, "anuncios", databases.createDatetimeAttribute.bind(databases), "fecha_publicacion", false);
    await ensureAttribute(dbId, "anuncios", databases.createIntegerAttribute.bind(databases), "dias_vigencia", false);
    await ensureAttribute(dbId, "anuncios", databases.createIntegerAttribute.bind(databases), "vistas", false);
    await ensureAttribute(dbId, "anuncios", databases.createIntegerAttribute.bind(databases), "clics", false);
    await ensureAttribute(dbId, "anuncios", databases.createIntegerAttribute.bind(databases), "contactos", false);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "telefono_contacto", 255, false);
    await ensureAttribute(dbId, "anuncios", databases.createRelationshipAttribute.bind(databases), "grupos_whatsapp", "manyToOne", false, "grupo_origen_id", null, "setNull");


    // --- Pedidos ---
    await ensureAttribute(dbId, "pedidos", databases.createRelationshipAttribute.bind(databases), "anuncios", "manyToOne", false, "anuncio_id", null, "setNull");
    await ensureAttribute(dbId, "pedidos", databases.createRelationshipAttribute.bind(databases), "anunciantes", "manyToOne", false, "anunciante_id", null, "setNull");
    await ensureAttribute(dbId, "pedidos", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToOne", false, "residencial_id", null, "setNull");
    await ensureAttribute(dbId, "pedidos", databases.createStringAttribute.bind(databases), "comprador_telefono", 255, true);
    await ensureAttribute(dbId, "pedidos", databases.createStringAttribute.bind(databases), "comprador_nombre", 255, true);
    await ensureAttribute(dbId, "pedidos", databases.createStringAttribute.bind(databases), "direccion_entrega", 500, true);
    await ensureAttribute(dbId, "pedidos", databases.createIntegerAttribute.bind(databases), "cantidad", false);
    await ensureAttribute(dbId, "pedidos", databases.createFloatAttribute.bind(databases), "precio_unitario", false);
    await ensureAttribute(dbId, "pedidos", databases.createFloatAttribute.bind(databases), "precio_total", false);
    await ensureAttribute(dbId, "pedidos", databases.createStringAttribute.bind(databases), "mensaje_whatsapp_generado", 2000, false);
    await ensureAttribute(dbId, "pedidos", databases.createFloatAttribute.bind(databases), "geolocalizacion_cliente_lat", false);
    await ensureAttribute(dbId, "pedidos", databases.createFloatAttribute.bind(databases), "geolocalizacion_cliente_lng", false);
    await ensureAttribute(dbId, "pedidos", databases.createFloatAttribute.bind(databases), "distancia_residencial_metros", false);
    await ensureAttribute(dbId, "pedidos", databases.createStringAttribute.bind(databases), "estado", 50, false);
    await ensureAttribute(dbId, "pedidos", databases.createDatetimeAttribute.bind(databases), "fecha_creacion", false);

    // --- Mensajes WhatsApp ---
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createStringAttribute.bind(databases), "whatsapp_message_id", 255, true);
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToOne", false, "residencial_id", null, "setNull");
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createStringAttribute.bind(databases), "telefono_remitente", 255, false);
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createStringAttribute.bind(databases), "texto", 2000, false);
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createStringAttribute.bind(databases), "adjuntos", 5000, false);
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createDatetimeAttribute.bind(databases), "fecha_mensaje", false);
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createBooleanAttribute.bind(databases), "procesado", false);
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createRelationshipAttribute.bind(databases), "anuncios", "manyToOne", false, "anuncio_id", null, "setNull");
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createRelationshipAttribute.bind(databases), "grupos_whatsapp", "manyToOne", false, "grupo_id", null, "setNull");


    // --- Grupos WhatsApp ---
    await ensureAttribute(dbId, "grupos_whatsapp", databases.createStringAttribute.bind(databases), "nombre_grupo", 255, true);
    await ensureAttribute(dbId, "grupos_whatsapp", databases.createStringAttribute.bind(databases), "whatsapp_group_id", 255, true);
    await ensureAttribute(dbId, "grupos_whatsapp", databases.createUrlAttribute.bind(databases), "link_invitacion", false);
    await ensureAttribute(dbId, "grupos_whatsapp", databases.createStringAttribute.bind(databases), "descripcion", 2000, false);
    await ensureAttribute(dbId, "grupos_whatsapp", databases.createBooleanAttribute.bind(databases), "activo", false);
    await ensureAttribute(dbId, "grupos_whatsapp", databases.createDatetimeAttribute.bind(databases), "fecha_vinculacion", false);
    await ensureAttribute(dbId, "grupos_whatsapp", databases.createIntegerAttribute.bind(databases), "numero_miembros", false);
    await ensureAttribute(dbId, "grupos_whatsapp", databases.createStringAttribute.bind(databases), "reglas", 2000, false);
    await ensureAttribute(dbId, "grupos_whatsapp", databases.createStringAttribute.bind(databases), "tipo_grupo", 100, false);
    await ensureAttribute(dbId, "grupos_whatsapp", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToOne", false, "residencial_id", null, "setNull");

    // --- Avisos Comunidad ---
    await ensureAttribute(dbId, "avisos_comunidad", databases.createStringAttribute.bind(databases), "titulo", 255, true);
    await ensureAttribute(dbId, "avisos_comunidad", databases.createStringAttribute.bind(databases), "descripcion", 2000, false);
    await ensureAttribute(dbId, "avisos_comunidad", databases.createStringAttribute.bind(databases), "nivel", 50, false);
    await ensureAttribute(dbId, "avisos_comunidad", databases.createDatetimeAttribute.bind(databases), "fecha_inicio", false);
    await ensureAttribute(dbId, "avisos_comunidad", databases.createDatetimeAttribute.bind(databases), "fecha_fin", false);
    await ensureAttribute(dbId, "avisos_comunidad", databases.createBooleanAttribute.bind(databases), "activo", false);
    await ensureAttribute(dbId, "avisos_comunidad", databases.createStringAttribute.bind(databases), "alcance", 100, false);
    await ensureAttribute(dbId, "avisos_comunidad", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToOne", false, "residencial_id", null, "setNull");

    // --- Anuncios Pago ---
    await ensureAttribute(dbId, "anuncios_pago", databases.createStringAttribute.bind(databases), "titulo", 255, true);
    await ensureAttribute(dbId, "anuncios_pago", databases.createStringAttribute.bind(databases), "descripcion", 1000, false);
    await ensureAttribute(dbId, "anuncios_pago", databases.createUrlAttribute.bind(databases), "imagen_url", true);
    await ensureAttribute(dbId, "anuncios_pago", databases.createUrlAttribute.bind(databases), "enlace_destino", false);
    await ensureAttribute(dbId, "anuncios_pago", databases.createDatetimeAttribute.bind(databases), "fecha_inicio", true);
    await ensureAttribute(dbId, "anuncios_pago", databases.createDatetimeAttribute.bind(databases), "fecha_fin", true);
    await ensureAttribute(dbId, "anuncios_pago", databases.createBooleanAttribute.bind(databases), "activo", false);
    await ensureAttribute(dbId, "anuncios_pago", databases.createIntegerAttribute.bind(databases), "prioridad", false);
    await ensureAttribute(dbId, "anuncios_pago", databases.createStringAttribute.bind(databases), "ubicacion", 100, false);
    await ensureAttribute(dbId, "anuncios_pago", databases.createStringAttribute.bind(databases), "tipo_publicidad", 100, false);
    await ensureAttribute(dbId, "anuncios_pago", databases.createIntegerAttribute.bind(databases), "clicks", false);
    await ensureAttribute(dbId, "anuncios_pago", databases.createIntegerAttribute.bind(databases), "impresiones", false);
    await ensureAttribute(dbId, "anuncios_pago", databases.createFloatAttribute.bind(databases), "inversion", false);
    await ensureAttribute(dbId, "anuncios_pago", databases.createStringAttribute.bind(databases), "estado_pago", 50, false);
    await ensureAttribute(dbId, "anuncios_pago", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToMany", false, "residenciales", "anuncios_pago", "cascade");
    await ensureAttribute(dbId, "anuncios_pago", databases.createRelationshipAttribute.bind(databases), "anunciantes", "manyToOne", false, "cliente_id", null, "setNull");

    // --- Contenidos ---
    await ensureAttribute(dbId, "contenidos", databases.createStringAttribute.bind(databases), "titulo", 255, true);
    await ensureAttribute(dbId, "contenidos", databases.createStringAttribute.bind(databases), "slug", 255, true);
    await ensureAttribute(dbId, "contenidos", databases.createStringAttribute.bind(databases), "contenido", 10000, false);
    await ensureAttribute(dbId, "contenidos", databases.createStringAttribute.bind(databases), "extracto", 500, false);
    await ensureAttribute(dbId, "contenidos", databases.createStringAttribute.bind(databases), "tipo", 50, false);
    await ensureAttribute(dbId, "contenidos", databases.createStringAttribute.bind(databases), "categoria", 100, false);
    await ensureAttribute(dbId, "contenidos", databases.createStringAttribute.bind(databases), "estado", 50, false);
    await ensureAttribute(dbId, "contenidos", databases.createUrlAttribute.bind(databases), "imagen_destacada", false);
    await ensureAttribute(dbId, "contenidos", databases.createStringAttribute.bind(databases), "tags", 255, false, undefined, true);
    await ensureAttribute(dbId, "contenidos", databases.createDatetimeAttribute.bind(databases), "fecha_publicacion", false);
    await ensureAttribute(dbId, "contenidos", databases.createStringAttribute.bind(databases), "autor_nombre", 255, false);
    await ensureAttribute(dbId, "contenidos", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToOne", false, "residencial_id", null, "setNull");

    // --- Logs ---
    await ensureAttribute(dbId, "logs", databases.createStringAttribute.bind(databases), "event_type", 50, true);
    await ensureAttribute(dbId, "logs", databases.createStringAttribute.bind(databases), "ad_type", 50, true);
    await ensureAttribute(dbId, "logs", databases.createDatetimeAttribute.bind(databases), "timestamp", false);
    await ensureAttribute(dbId, "logs", databases.createStringAttribute.bind(databases), "ip_address", 50, false);
    await ensureAttribute(dbId, "logs", databases.createStringAttribute.bind(databases), "user_agent", 255, false);
    await ensureAttribute(dbId, "logs", databases.createStringAttribute.bind(databases), "metadata", 2000, false);
    await ensureAttribute(dbId, "logs", databases.createStringAttribute.bind(databases), "ad_id", 255, false);
    await ensureAttribute(dbId, "logs", databases.createStringAttribute.bind(databases), "user_id", 255, false);

    // --- Reviews ---
    await ensureAttribute(dbId, "reviews", databases.createIntegerAttribute.bind(databases), "rating", true);
    await ensureAttribute(dbId, "reviews", databases.createStringAttribute.bind(databases), "comentario", 1000, false);
    await ensureAttribute(dbId, "reviews", databases.createStringAttribute.bind(databases), "autor_nombre", 255, true);
    await ensureAttribute(dbId, "reviews", databases.createDatetimeAttribute.bind(databases), "fecha", false);
    await ensureAttribute(dbId, "reviews", databases.createStringAttribute.bind(databases), "estado", 50, false);
    await ensureAttribute(dbId, "reviews", databases.createRelationshipAttribute.bind(databases), "anuncios", "manyToOne", false, "anuncio_id", null, "setNull");

    console.log("Appwrite schema initialization completed.");
}

main().catch((err) => {
    console.error("Error during schema creation:", err);
});
