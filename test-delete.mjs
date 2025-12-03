import { Client, Databases } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

console.log('🔧 Diagnóstico de Permisos de Appwrite\n');
console.log('Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
console.log('Project:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
console.log('API Key:', process.env.APPWRITE_API_KEY ? process.env.APPWRITE_API_KEY.substring(0, 20) + '...' : '❌ No configurada');

console.log('\n📋 Prueba 1: Listar documentos...');
databases.listDocuments('vecivendo-db', 'anuncios', [])
    .then(response => {
        console.log('✅ READ funciona:', response.total, 'documentos encontrados');

        if (response.documents.length > 0) {
            const testDoc = response.documents[0];
            console.log('\n📝 Prueba 2: Actualizar documento...');
            console.log('ID del documento:', testDoc.$id);

            // Intentar actualizar (solo cambiar un campo sin afectar datos)
            return databases.updateDocument('vecivendo-db', 'anuncios', testDoc.$id, {
                // No cambiamos nada importante, solo para probar permisos
            }).then(() => {
                console.log('✅ UPDATE funciona');
                return testDoc.$id;
            }).catch(updateError => {
                console.error('❌ UPDATE falla:', {
                    message: updateError.message,
                    code: updateError.code,
                    type: updateError.type
                });
                return testDoc.$id;
            });
        } else {
            console.log('⚠️ No hay documentos para probar');
            process.exit(0);
        }
    })
    .then(testId => {
        console.log('\n🗑️ Prueba 3: Eliminar documento...');
        console.log('ID del documento:', testId);

        return databases.deleteDocument('vecivendo-db', 'anuncios', testId);
    })
    .then(() => {
        console.log('✅ DELETE funciona - ¡Permisos correctos!');
        console.log('\n✨ Todas las operaciones funcionan correctamente');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error en operación:', {
            message: error.message,
            code: error.code,
            type: error.type
        });

        console.log('\n🔍 Diagnóstico:');
        if (error.code === 500) {
            console.log('❌ Error 500 - Problema del servidor de Appwrite');
            console.log('\n💡 Posibles causas:');
            console.log('1. La API Key no tiene el scope "databases.write"');
            console.log('2. La colección "anuncios" no permite eliminación');
            console.log('3. Los documentos tienen permisos restrictivos');
            console.log('\n📝 Solución:');
            console.log('1. Ve a Appwrite Console → Settings → API Keys');
            console.log('2. Verifica que la API Key tenga el scope "databases.write"');
            console.log('3. Si no lo tiene, crea una nueva API Key con ese scope');
            console.log('4. Actualiza APPWRITE_API_KEY en .env.local');
        }

        process.exit(1);
    });
