import { NextResponse } from 'next/server';
import { databases, dbId, adsCollectionId } from '@/lib/appwrite-server';

// POST /api/ads/batch-delete - Eliminar múltiples anuncios
export async function POST(request) {
    try {
        const body = await request.json();
        const { ids } = body;

        // Validar que ids sea un array
        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'Se requiere un array de IDs no vacío' },
                { status: 400 }
            );
        }

        console.log('🗑️ [API] Iniciando eliminación batch de', ids.length, 'anuncios');
        console.log('📋 [API] IDs a eliminar:', ids);

        // Función para procesar en chunks
        const processInChunks = async (items, chunkSize = 5) => {
            const results = [];
            for (let i = 0; i < items.length; i += chunkSize) {
                const chunk = items.slice(i, i + chunkSize);
                console.log(`🔄 [API] Procesando chunk ${Math.floor(i / chunkSize) + 1} de ${Math.ceil(items.length / chunkSize)}`);

                const chunkPromises = chunk.map(id => {
                    console.log(`   🗑️ Intentando eliminar anuncio: ${id}`);
                    return databases.deleteDocument(dbId, adsCollectionId, id)
                        .then(() => {
                            console.log(`   ✅ Anuncio ${id} eliminado exitosamente`);
                            return { id, success: true };
                        })
                        .catch(error => {
                            console.error(`   ❌ Error eliminando anuncio ${id}:`, error.message);
                            return {
                                id,
                                success: false,
                                error: error.message
                            };
                        });
                });

                const chunkResults = await Promise.all(chunkPromises);
                results.push(...chunkResults);
            }
            return results;
        };

        const results = await processInChunks(ids, 5);

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`📊 [API] Resultados: ${successful.length} exitosos, ${failed.length} fallidos`);

        if (failed.length > 0) {
            console.error('❌ [API] Anuncios que fallaron:', failed);
        }

        return NextResponse.json({
            success: true,
            total: ids.length,
            successful: successful.length,
            failed: failed.length,
            results: results
        });

    } catch (error) {
        console.error('❌ [API] Error crítico en eliminación batch:', {
            message: error.message,
            code: error.code,
            type: error.type
        });

        return NextResponse.json(
            { error: error.message || 'Error en eliminación batch' },
            { status: error.code || 500 }
        );
    }
}
