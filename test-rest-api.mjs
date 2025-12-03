import 'dotenv/config';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

console.log('🔧 Prueba directa con API REST de Appwrite\n');
console.log('Endpoint:', endpoint);
console.log('Project:', projectId);
console.log('API Key:', apiKey ? apiKey.substring(0, 20) + '...' : '❌ No configurada');

// Primero listar documentos
console.log('\n📋 Paso 1: Listar documentos...');
fetch(`${endpoint}/databases/vecivendo-db/collections/anuncios/documents`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId,
        'X-Appwrite-Key': apiKey
    }
})
    .then(response => response.json())
    .then(data => {
        if (data.documents && data.documents.length > 0) {
            console.log('✅ Listado exitoso:', data.total, 'documentos');
            const testDoc = data.documents[0];
            console.log('Documento de prueba:', testDoc.$id);
            console.log('Permisos del documento:', testDoc.$permissions);

            // Intentar eliminar con API REST
            console.log('\n🗑️ Paso 2: Eliminar con API REST...');
            return fetch(`${endpoint}/databases/vecivendo-db/collections/anuncios/documents/${testDoc.$id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': projectId,
                    'X-Appwrite-Key': apiKey
                }
            });
        } else {
            console.log('⚠️ No hay documentos');
            process.exit(0);
        }
    })
    .then(response => {
        console.log('Status:', response.status, response.statusText);
        return response.text();
    })
    .then(text => {
        console.log('Respuesta:', text);

        if (text.includes('Server Error') || text.includes('500')) {
            console.log('\n❌ Error 500 confirmado con API REST');
            console.log('\n🔍 Esto sugiere un problema en el servidor de Appwrite, no en el SDK');
            console.log('\n💡 Posibles causas:');
            console.log('1. Relaciones entre colecciones mal configuradas');
            console.log('2. Triggers o webhooks que fallan');
            console.log('3. Bug en la versión de Appwrite');
            console.log('4. Problema con el storage de Appwrite');
            console.log('\n📝 Siguiente paso:');
            console.log('Revisa los logs de Docker de Appwrite:');
            console.log('docker logs appwrite -n 100 --tail 50');
        } else {
            console.log('\n✅ Eliminación exitosa con API REST!');
        }
    })
    .catch(error => {
        console.error('\n❌ Error:', error.message);
    });
