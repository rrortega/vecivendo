import { Client, Databases } from 'node-appwrite';
import { Permission, Role } from 'node-appwrite';
import 'dotenv/config';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

console.log('🔧 Arreglando permisos de documentos existentes\n');

// Listar todos los documentos
databases.listDocuments('vecivendo-db', 'anuncios', [])
    .then(response => {
        console.log(`📋 Encontrados ${response.total} documentos`);

        const docsWithoutPermissions = response.documents.filter(doc =>
            !doc.$permissions || doc.$permissions.length === 0
        );

        console.log(`⚠️  ${docsWithoutPermissions.length} documentos sin permisos`);

        if (docsWithoutPermissions.length === 0) {
            console.log('✅ Todos los documentos tienen permisos');
            process.exit(0);
        }

        console.log('\n🔄 Actualizando permisos...\n');

        // Actualizar cada documento para agregar permisos
        const updatePromises = docsWithoutPermissions.map((doc, index) => {
            return databases.updateDocument(
                'vecivendo-db',
                'anuncios',
                doc.$id,
                {},  // No cambiamos datos
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.any()),
                    Permission.delete(Role.any())
                ]
            ).then(() => {
                console.log(`✅ [${index + 1}/${docsWithoutPermissions.length}] Actualizado: ${doc.$id} - ${doc.titulo}`);
                return { id: doc.$id, success: true };
            }).catch(error => {
                console.error(`❌ [${index + 1}/${docsWithoutPermissions.length}] Error en ${doc.$id}:`, error.message);
                return { id: doc.$id, success: false, error: error.message };
            });
        });

        return Promise.all(updatePromises);
    })
    .then(results => {
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`\n📊 Resultados:`);
        console.log(`✅ Exitosos: ${successful}`);
        console.log(`❌ Fallidos: ${failed}`);

        if (failed > 0) {
            console.log('\n⚠️  Algunos documentos fallaron, revisa los errores arriba');
        } else {
            console.log('\n✨ ¡Todos los documentos actualizados correctamente!');
            console.log('\n🧪 Ahora prueba eliminar un documento:');
            console.log('node test-delete.mjs');
        }

        process.exit(failed > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    });
