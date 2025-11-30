import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

async function setupWhatsAppGroups() {
    console.log('📱 Setting up WhatsApp Groups collection...\n');

    const collectionId = 'grupos_whatsapp';

    try {
        // Try to get existing collection
        try {
            await databases.getCollection(dbId, collectionId);
            console.log('ℹ️  Collection already exists, updating...');
        } catch {
            // Create collection if it doesn't exist
            await databases.createCollection(
                dbId,
                collectionId,
                'Grupos de WhatsApp',
                [],
                false,
                true,
                ['read("any")'],
                ['create("users")', 'update("users")', 'delete("users")']
            );
            console.log('✅ Collection created');
        }

        // Helper function to create or update attributes
        const createAttribute = async (key, type, config) => {
            try {
                await databases.deleteAttribute(dbId, collectionId, key);
                console.log(`   🗑️  Deleted old attribute: ${key}`);
            } catch (e) {
                // Attribute doesn't exist, that's fine
            }

            try {
                switch (type) {
                    case 'string':
                        await databases.createStringAttribute(
                            dbId,
                            collectionId,
                            key,
                            config.size || 255,
                            config.required || false,
                            config.default || null,
                            config.array || false
                        );
                        break;
                    case 'integer':
                        await databases.createIntegerAttribute(
                            dbId,
                            collectionId,
                            key,
                            config.required || false,
                            config.min,
                            config.max,
                            config.default,
                            config.array || false
                        );
                        break;
                    case 'boolean':
                        await databases.createBooleanAttribute(
                            dbId,
                            collectionId,
                            key,
                            config.required || false,
                            config.default || false,
                            config.array || false
                        );
                        break;
                    case 'datetime':
                        await databases.createDatetimeAttribute(
                            dbId,
                            collectionId,
                            key,
                            config.required || false,
                            config.default,
                            config.array || false
                        );
                        break;
                }
                console.log(`   ✅ Created attribute: ${key} (${type})`);
            } catch (e) {
                console.error(`   ❌ Error creating ${key}:`, e.message);
            }
        };

        // Create attributes
        await createAttribute('nombre_grupo', 'string', { size: 255, required: true });
        await createAttribute('whatsapp_group_id', 'string', { size: 255, required: false });
        await createAttribute('descripcion', 'string', { size: 1000, required: false });
        await createAttribute('activo', 'boolean', { required: false, default: true });
        await createAttribute('fecha_vinculacion', 'datetime', { required: false });
        await createAttribute('numero_miembros', 'integer', { required: false, min: 0 });

        // Wait for attributes to be created
        console.log('\n⏳ Waiting for attributes to be available...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Create relationship with residenciales
        console.log('\n🔗 Creating relationship with residenciales...');
        try {
            await databases.createRelationshipAttribute(
                dbId,
                collectionId,
                'residenciales',
                'manyToOne',
                true,
                'residencial',
                'grupos_whatsapp',
                'cascade'
            );
            console.log('   ✅ Relationship created: grupos_whatsapp.residencial -> residenciales');
        } catch (e) {
            if (e.code === 409) {
                console.log('   ℹ️  Relationship already exists');
            } else {
                console.error('   ❌ Error creating relationship:', e.message);
            }
        }

        console.log('\n✨ WhatsApp Groups collection setup complete!\n');

    } catch (error) {
        console.error('❌ Setup failed:', error);
    }
}

setupWhatsAppGroups();
