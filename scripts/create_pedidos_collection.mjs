import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const COLLECTION_ID = 'pedidos';

async function createPedidosCollection() {
    try {
        console.log('--- Creando colección de pedidos ---');

        // Crear colección
        try {
            await databases.getCollection(dbId, COLLECTION_ID);
            console.log('✅ La colección pedidos ya existe.');
        } catch (error) {
            if (error.code === 404) {
                console.log('Creando colección pedidos...');
                await databases.createCollection(
                    dbId,
                    COLLECTION_ID,
                    'Pedidos',
                    [
                        Permission.read(Role.any()),
                        Permission.create(Role.users()),
                        Permission.update(Role.users()),
                        Permission.delete(Role.team('admins')),
                    ]
                );
                console.log('✅ Colección pedidos creada.');
            } else {
                throw error;
            }
        }

        // Función helper para crear atributos
        const createAttribute = async (type, key, ...args) => {
            try {
                if (type === 'string') {
                    await databases.createStringAttribute(dbId, COLLECTION_ID, key, ...args);
                } else if (type === 'float') {
                    await databases.createFloatAttribute(dbId, COLLECTION_ID, key, ...args);
                } else if (type === 'boolean') {
                    await databases.createBooleanAttribute(dbId, COLLECTION_ID, key, ...args);
                } else if (type === 'enum') {
                    await databases.createEnumAttribute(dbId, COLLECTION_ID, key, ...args);
                }
                console.log(`✅ Atributo '${key}' creado.`);
            } catch (e) {
                if (e.code === 409) {
                    console.log(`ℹ️ Atributo '${key}' ya existe.`);
                } else {
                    console.error(`❌ Error creando '${key}':`, e.message);
                }
            }
        };

        // Crear atributos
        await createAttribute('string', 'numero_pedido', 50, true); // Único
        await createAttribute('string', 'residencial_id', 50, true);
        await createAttribute('string', 'comprador_id', 50, true);
        await createAttribute('string', 'comprador_nombre', 255, true);
        await createAttribute('string', 'comprador_telefono', 20, true);
        await createAttribute('string', 'direccion_entrega', 500, true);
        await createAttribute('string', 'calle', 255, false);
        await createAttribute('string', 'manzana', 50, false);
        await createAttribute('string', 'lote', 50, false);
        await createAttribute('string', 'como_llegar', 500, false);
        await createAttribute('string', 'items', 10000, true); // JSON string
        await createAttribute('float', 'total', true);
        await createAttribute('enum', 'estado', ['pendiente', 'confirmado', 'en_proceso', 'completado', 'cancelado'], true, 'pendiente');
        await createAttribute('string', 'anunciante_id', 50, true);
        await createAttribute('string', 'anunciante_telefono', 20, true);
        await createAttribute('boolean', 'mensaje_enviado', false, false);

        console.log('\n⏳ Esperando 5 segundos para que los atributos se indexen...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Crear índice único para numero_pedido
        try {
            await databases.createIndex(
                dbId,
                COLLECTION_ID,
                'numero_pedido_unique',
                'unique',
                ['numero_pedido'],
                ['ASC']
            );
            console.log('✅ Índice único para numero_pedido creado.');
        } catch (e) {
            if (e.code === 409) {
                console.log('ℹ️ Índice único ya existe.');
            } else {
                console.error('❌ Error creando índice:', e.message);
            }
        }

        console.log('✅ Migración completada exitosamente.');

    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

createPedidosCollection();
