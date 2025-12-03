import { Client, Databases, Query } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

console.log('🔍 Investigando relaciones de anuncios\n');

// Primero, obtener un anuncio que falla
databases.listDocuments('vecivendo-db', 'anuncios', [Query.limit(1)])
    .then(response => {
        if (response.documents.length === 0) {
            console.log('⚠️  No hay anuncios');
            process.exit(0);
        }

        const testAd = response.documents[0];
        console.log('📋 Anuncio de prueba:', testAd.$id, '-', testAd.titulo);
        console.log('Permisos:', testAd.$permissions);

        // Buscar logs relacionados
        console.log('\n🔍 Buscando logs relacionados...');
        return databases.listDocuments('vecivendo-db', 'logs', [
            Query.equal('anuncioId', testAd.$id)
        ]).then(logsResponse => {
            console.log(`📊 Logs encontrados: ${logsResponse.total}`);

            if (logsResponse.total > 0) {
                console.log('\n📝 Primeros logs:');
                logsResponse.documents.slice(0, 3).forEach(log => {
                    console.log(`  - ${log.$id}: tipo=${log.tipo}, permisos=${log.$permissions.length}`);
                });

                console.log('\n💡 Hipótesis: Los logs tienen permisos vacíos y no se pueden eliminar en cascada');
                console.log('\n🔧 Solución: Eliminar manualmente los logs primero');

                return { adId: testAd.$id, logs: logsResponse.documents };
            } else {
                console.log('\n⚠️  No hay logs para este anuncio, el problema es otro');
                return { adId: testAd.$id, logs: [] };
            }
        });
    })
    .then(({ adId, logs }) => {
        if (logs.length === 0) {
            console.log('\n🧪 Intentando eliminar anuncio sin logs...');
            return databases.deleteDocument('vecivendo-db', 'anuncios', adId);
        } else {
            console.log(`\n🗑️  Eliminando ${logs.length} logs primero...`);
            const deletePromises = logs.map(log =>
                databases.deleteDocument('vecivendo-db', 'logs', log.$id)
                    .then(() => ({ id: log.$id, success: true }))
                    .catch(error => ({ id: log.$id, success: false, error: error.message }))
            );

            return Promise.all(deletePromises).then(results => {
                const successful = results.filter(r => r.success).length;
                const failed = results.filter(r => !r.success).length;

                console.log(`📊 Logs eliminados: ${successful} exitosos, ${failed} fallidos`);

                if (failed > 0) {
                    console.log('❌ No se pudieron eliminar todos los logs');
                    results.filter(r => !r.success).forEach(r => {
                        console.log(`  - ${r.id}: ${r.error}`);
                    });
                    throw new Error('No se pudieron eliminar los logs');
                }

                console.log('\n🧪 Ahora intentando eliminar el anuncio...');
                return databases.deleteDocument('vecivendo-db', 'anuncios', adId);
            });
        }
    })
    .then(() => {
        console.log('\n✅ ¡Anuncio eliminado exitosamente!');
        console.log('\n💡 Solución confirmada: Hay que eliminar los logs primero');
        console.log('\n📝 Opciones:');
        console.log('1. Modificar la relación para que NO sea cascade');
        console.log('2. Arreglar los permisos de los logs');
        console.log('3. Eliminar logs manualmente antes de eliminar anuncios');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Error:', {
            message: error.message,
            code: error.code,
            type: error.type
        });
        process.exit(1);
    });
