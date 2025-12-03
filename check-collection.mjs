import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

console.log('🔍 Verificando configuración de la colección\n');

// Obtener información de la colección
databases.getCollection('vecivendo-db', 'anuncios')
    .then(collection => {
        console.log('📋 Información de la colección "anuncios":\n');
        console.log('ID:', collection.$id);
        console.log('Nombre:', collection.name);
        console.log('Permisos de la colección:', collection.$permissions);
        console.log('Seguridad de documentos:', collection.documentSecurity || 'No disponible');
        console.log('\n📊 Configuración completa:');
        console.log(JSON.stringify(collection, null, 2));

        if (!collection.$permissions || collection.$permissions.length === 0) {
            console.log('\n❌ PROBLEMA ENCONTRADO:');
            console.log('La colección NO tiene permisos configurados');
            console.log('\n💡 Solución:');
            console.log('1. Ve a Appwrite Console');
            console.log('2. Databases → vecivendo-db → anuncios → Settings');
            console.log('3. En la sección "Permissions", agrega:');
            console.log('   - Role: Any');
            console.log('   - Permisos: Create, Read, Update, Delete');
        } else {
            console.log('\n✅ La colección tiene permisos configurados');
            console.log('Permisos:', collection.$permissions);
        }
    })
    .catch(error => {
        console.error('❌ Error obteniendo colección:', error.message);
    });
