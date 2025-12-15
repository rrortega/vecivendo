
const { Client, Databases, Permission, Role } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

async function updateSchema() {
    try {
        console.log(`Using Database ID: ${dbId}`);

        // 1. Logs Collection
        const logsId = 'logs'; // Assuming ID is 'logs'
        console.log('Checking logs collection...');

        try {
            await databases.getCollection(dbId, logsId);
            console.log('Logs collection exists.');
        } catch (e) {
            console.log('Logs collection missing, please create it manually or verify ID.');
            return;
        }

        // Add attributes to logs
        const logAttrs = [
            { key: 'residencialId', type: 'string', size: 36, required: false },
            { key: 'cost', type: 'double', required: false }
        ];

        for (const attr of logAttrs) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(dbId, logsId, attr.key, attr.size, attr.required);
                } else if (attr.type === 'double') {
                    await databases.createFloatAttribute(dbId, logsId, attr.key, attr.required);
                }
                console.log(`Created attribute ${attr.key} in logs.`);
            } catch (e) {
                console.log(`Attribute ${attr.key} in logs: ${e.message}`);
            }
        }

        // 2. Costo Por Vista
        const costViewId = 'costo_por_vista';
        try {
            await databases.getCollection(dbId, costViewId);
            console.log('costo_por_vista exists.');
        } catch (e) {
            console.log('Creating costo_por_vista...');
            await databases.createCollection(dbId, costViewId, 'Costo Por Vista', [
                Permission.read(Role.any()),
                Permission.update(Role.any())
            ]);
        }

        try {
            await databases.createFloatAttribute(dbId, costViewId, 'costo', true, 1.0);
            console.log('Created attribute costo in costo_por_vista.');
        } catch (e) {
            console.log(`Attribute costo in costo_por_vista: ${e.message}`);
        }

        // 3. Costo Por Click
        const costClickId = 'costo_por_click';
        try {
            await databases.getCollection(dbId, costClickId);
            console.log('costo_por_click exists.');
        } catch (e) {
            console.log('Creating costo_por_click...');
            await databases.createCollection(dbId, costClickId, 'Costo Por Click', [
                Permission.read(Role.any()),
                Permission.update(Role.any())
            ]);
        }

        try {
            await databases.createFloatAttribute(dbId, costClickId, 'costo', true, 5.0);
            console.log('Created attribute costo in costo_por_click.');
        } catch (e) {
            console.log(`Attribute costo in costo_por_click: ${e.message}`);
        }

        // 4. Create default documents if empty
        console.log('Checking default cost documents...');
        const views = await databases.listDocuments(dbId, costViewId);
        if (views.total === 0) {
            await databases.createDocument(dbId, costViewId, 'default_view_cost', { costo: 1.0 });
            console.log('Created default view cost document.');
        }

        const clicks = await databases.listDocuments(dbId, costClickId);
        if (clicks.total === 0) {
            await databases.createDocument(dbId, costClickId, 'default_click_cost', { costo: 5.0 });
            console.log('Created default click cost document.');
        }

    } catch (e) {
        console.error('Error updating schema:', e);
    }
}

updateSchema();
