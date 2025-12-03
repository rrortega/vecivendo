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
    ];

    for (const col of collections) {
        await ensureCollection(dbId, col.id, col.name);
    }

    // 3️⃣ Attributes per collection

    // --- Residenciales ---
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "nombre", 255, true);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "slug", 255, true);
    await ensureAttribute(dbId, "residenciales", databases.createStringAttribute.bind(databases), "whatsapp_group_id", 255, true);
    await ensureAttribute(dbId, "residenciales", databases.createFloatAttribute.bind(databases), "ubicacion_centro_lat", true);
    await ensureAttribute(dbId, "residenciales", databases.createFloatAttribute.bind(databases), "ubicacion_centro_lng", true);
    await ensureAttribute(dbId, "residenciales", databases.createIntegerAttribute.bind(databases), "radio_autorizado_metros", true);

    // --- Anunciantes ---
    await ensureAttribute(dbId, "anunciantes", databases.createStringAttribute.bind(databases), "telefono_whatsapp", 255, true);
    await ensureAttribute(dbId, "anunciantes", databases.createStringAttribute.bind(databases), "nombre_anunciante", 255, false);
    // Relationship: Anunciante belongs to Residencial (Many Anunciantes -> One Residencial)
    // createRelationshipAttribute(dbId, colId, relatedColId, type, twoWay, key, twoWayKey, onDelete)
    await ensureAttribute(dbId, "anunciantes", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToOne", false, "residencial_id", null, "setNull");
    await ensureAttribute(dbId, "anunciantes", databases.createDatetimeAttribute.bind(databases), "ultima_actividad", false);

    // --- Anuncios ---
    // Relationship: Anuncio belongs to Residencial
    await ensureAttribute(dbId, "anuncios", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToOne", false, "residencial_id", null, "setNull");
    // Relationship: Anuncio belongs to Anunciante
    await ensureAttribute(dbId, "anuncios", databases.createRelationshipAttribute.bind(databases), "anunciantes", "manyToOne", false, "anunciante_id", null, "setNull");

    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "mensaje_original_id", 255, false);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "titulo", 255, true);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "descripcion", 2000, false);
    await ensureAttribute(dbId, "anuncios", databases.createFloatAttribute.bind(databases), "precio", false);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "moneda", 10, false);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "categoria", 255, false);
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "tipo", 20, false);
    // Array of file IDs for images (String array)
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "imagenes", 255, false, undefined, true); // array=true
    await ensureAttribute(dbId, "anuncios", databases.createBooleanAttribute.bind(databases), "activo", true);
    // metadata_ia (JSON) -> String
    await ensureAttribute(dbId, "anuncios", databases.createStringAttribute.bind(databases), "metadata_ia", 5000, false);

    // --- Pedidos ---
    // Relationships
    await ensureAttribute(dbId, "pedidos", databases.createRelationshipAttribute.bind(databases), "anuncios", "manyToOne", false, "anuncio_id", null, "setNull");
    await ensureAttribute(dbId, "pedidos", databases.createRelationshipAttribute.bind(databases), "anunciantes", "manyToOne", false, "anunciante_id", null, "setNull");
    await ensureAttribute(dbId, "pedidos", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToOne", false, "residencial_id", null, "setNull");

    await ensureAttribute(dbId, "pedidos", databases.createStringAttribute.bind(databases), "nombre_cliente", 255, true);
    await ensureAttribute(dbId, "pedidos", databases.createStringAttribute.bind(databases), "direccion_cliente", 500, true);
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
    // Relationship
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createRelationshipAttribute.bind(databases), "residenciales", "manyToOne", false, "residencial_id", null, "setNull");

    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createStringAttribute.bind(databases), "telefono_remitente", 255, false);
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createStringAttribute.bind(databases), "texto", 2000, false);
    // adjuntos (JSON) -> String
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createStringAttribute.bind(databases), "adjuntos", 5000, false);
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createDatetimeAttribute.bind(databases), "fecha_mensaje", false);
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createBooleanAttribute.bind(databases), "procesado", false);
    // Relationship
    await ensureAttribute(dbId, "mensajes_whatsapp", databases.createRelationshipAttribute.bind(databases), "anuncios", "manyToOne", false, "anuncio_id", null, "setNull");

    console.log("Appwrite schema initialization completed.");
}

main().catch((err) => {
    console.error("Error during schema creation:", err);
});
