import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

console.log('🔧 Arreglando relación residencial → anuncios\n');
console.log('Problema: onDelete="cascade" en el lado incorrecto');
console.log('Solución: Eliminar y recrear la relación con onDelete="setNull"\n');

// Paso 1: Eliminar la relación existente
console.log('📋 Paso 1: Eliminando relación existente...');
databases.deleteAttribute('vecivendo-db', 'anuncios', 'residencial')
    .then(() => {
        console.log('✅ Relación eliminada');
        console.log('\n⏳ Esperando 5 segundos para que Appwrite procese...');
        return new Promise(resolve => setTimeout(resolve, 5000));
    })
    .then(() => {
        console.log('\n📋 Paso 2: Recreando relación con onDelete="setNull"...');
        return databases.createRelationshipAttribute(
            'vecivendo-db',
            'anuncios',
            'residenciales',
            'manyToOne',
            true,  // twoWay
            'residencial',
            'anuncios',
            'setNull'  // ← Cambio importante: setNull en lugar de cascade
        );
    })
    .then(() => {
        console.log('✅ Relación recreada correctamente');
        console.log('\n✨ Ahora prueba eliminar un anuncio:');
        console.log('node test-delete.mjs');
    })
    .catch(error => {
        console.error('\n❌ Error:', {
            message: error.message,
            code: error.code,
            type: error.type
        });

        if (error.message.includes('Attribute not found')) {
            console.log('\n💡 La relación ya fue eliminada, solo necesitas recrearla');
            console.log('Ejecuta este comando en Appwrite Console o crea la relación manualmente');
        }
    });
