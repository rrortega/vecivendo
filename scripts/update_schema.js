const sdk = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new sdk.Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
const collectionId = "residenciales";

if (!apiKey) {
    console.error("Error: APPWRITE_API_KEY is not defined in .env.local");
    process.exit(1);
}

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new sdk.Databases(client);

const attributes = [
    { key: 'direccion', type: 'string', size: 255, required: false },
    { key: 'ciudad', type: 'string', size: 100, required: false },
    { key: 'provincia_estado', type: 'string', size: 100, required: false },
    { key: 'codigo_postal', type: 'string', size: 20, required: false },
    { key: 'active', type: 'boolean', required: false, default: true },
    { key: 'moneda', type: 'string', size: 10, required: false, default: 'MXN' },
    { key: 'phone_prefix', type: 'string', size: 10, required: false },
    { key: 'grupos_whatsapp', type: 'string', size: 5000, required: false },
    { key: 'avisos', type: 'string', size: 5000, required: false },
];

const avisosCollectionId = "avisos_comunidad";

async function updateSchema() {
    console.log(`Starting schema update...`);

    try {
        // 1. Create 'avisos_comunidad' collection if not exists
        try {
            await databases.getCollection(dbId, avisosCollectionId);
            console.log(`Collection ${avisosCollectionId} already exists. Updating permissions...`);
            try {
                await databases.updateCollection(
                    dbId,
                    avisosCollectionId,
                    "Avisos Comunidad",
                    [
                        sdk.Permission.read("any"),
                        sdk.Permission.create("any"),
                        sdk.Permission.update("any"),
                        sdk.Permission.delete("any"),
                    ]
                );
                console.log(`Permissions updated for ${avisosCollectionId}.`);
            } catch (error) {
                console.error(`Error updating permissions for ${avisosCollectionId}:`, error.message);
            }
        } catch (error) {
            if (error.code === 404) {
                console.log(`Creating collection ${avisosCollectionId}...`);
                await databases.createCollection(dbId, avisosCollectionId, "Avisos Comunidad", [
                    sdk.Permission.read("any"),
                    sdk.Permission.create("any"),
                    sdk.Permission.update("any"),
                    sdk.Permission.delete("any"),
                ]);
                console.log(`Created collection ${avisosCollectionId}.`);
            } else {
                throw error;
            }
        }

        // 2. Add attributes to 'avisos_comunidad'
        const avisosAttributes = [
            { key: 'titulo', type: 'string', size: 255, required: true },
            { key: 'contenido', type: 'string', size: 5000, required: true },
            { key: 'duracion_dias', type: 'integer', required: false, default: 3 },
        ];

        const avisosResponse = await databases.listAttributes(dbId, avisosCollectionId);
        const existingAvisosAttributes = avisosResponse.attributes.map(a => a.key);

        // Remove deprecated 'fecha' attribute if it exists
        if (existingAvisosAttributes.includes('fecha')) {
            console.log(`Deleting deprecated 'fecha' attribute from ${avisosCollectionId}...`);
            try {
                await databases.deleteAttribute(dbId, avisosCollectionId, 'fecha');
                console.log(`Deleted 'fecha' attribute.`);
            } catch (e) {
                console.error(`Error deleting 'fecha':`, e.message);
            }
        }

        for (const attr of avisosAttributes) {
            if (!existingAvisosAttributes.includes(attr.key)) {
                console.log(`Creating attribute ${attr.key} in ${avisosCollectionId}...`);
                if (attr.type === 'string') {
                    await databases.createStringAttribute(dbId, avisosCollectionId, attr.key, attr.size, attr.required);
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(dbId, avisosCollectionId, attr.key, attr.required, 0, 365, attr.default);
                }
                console.log(`Created attribute ${attr.key}.`);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // 3. Create Relationship: Residenciales (One) -> Avisos (Many)
        // We add the relationship attribute to 'avisos_comunidad' pointing to 'residenciales'
        // But Appwrite relationships are defined on one side. Let's check if it exists on 'avisos_comunidad'.
        if (!existingAvisosAttributes.includes('residencial')) {
            console.log(`Creating relationship: ${avisosCollectionId} -> ${collectionId}...`);
            // createRelationship(databaseId, collectionId, relatedCollectionId, type, twoWay, key, twoWayKey, onDelete)
            // We want: One Residential has Many Avisos.
            // So in 'avisos_comunidad', we have a 'residencial' attribute.
            // Type: 'manyToOne' (Many Avisos belong to One Residential) if defining on Avisos.
            // Or 'oneToMany' if defining on Residential.
            // Let's define it on 'residenciales' as 'oneToMany' to 'avisos_comunidad', key 'avisos_comunidad'.

            // Check if 'avisos_comunidad' attribute exists on 'residenciales'
            const resResponse = await databases.listAttributes(dbId, collectionId);
            const resAttributes = resResponse.attributes.map(a => a.key);

            if (!resAttributes.includes('avisos_comunidad')) {
                console.log("Creating One-to-Many relationship on 'residenciales'...");
                try {
                    await databases.createRelationshipAttribute(
                        dbId,
                        collectionId,
                        avisosCollectionId,
                        'oneToMany',
                        true, // Two-way
                        'avisos_comunidad', // Key on 'residenciales'
                        'residencial', // Key on 'avisos_comunidad'
                        'cascade' // onDelete
                    );
                    console.log("Relationship created.");
                } catch (e) {
                    console.error("Error creating relationship:", e.message);
                }
            }
        }

        // 4. Clean up 'avisos' string attribute from 'residenciales'
        const resResponse = await databases.listAttributes(dbId, collectionId);
        const resAttributes = resResponse.attributes.map(a => a.key);
        if (resAttributes.includes('avisos')) {
            console.log("Deleting deprecated 'avisos' string attribute from 'residenciales'...");
            try {
                await databases.deleteAttribute(dbId, collectionId, 'avisos');
                console.log("Deleted 'avisos' attribute.");
            } catch (e) {
                console.error("Error deleting 'avisos':", e.message);
            }
        }

        // 5. Ensure other attributes on 'residenciales' exist (from previous logic)
        for (const attr of attributes) {
            if (attr.key === 'avisos') continue; // Skip the deprecated one
            if (!resAttributes.includes(attr.key)) {
                console.log(`Creating attribute: ${attr.key} on ${collectionId}`);
                // ... create logic ...
                if (attr.type === 'string') {
                    await databases.createStringAttribute(dbId, collectionId, attr.key, attr.size, attr.required);
                } else if (attr.type === 'boolean') {
                    await databases.createBooleanAttribute(dbId, collectionId, attr.key, attr.required, attr.default);
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log("Schema update completed.");

    } catch (error) {
        console.error("Error updating schema:", error);
    }
}

updateSchema();
