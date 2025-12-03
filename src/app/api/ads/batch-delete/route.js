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

        // Eliminar todos en paralelo con manejo individual de errores
        const deletePromises = ids.map(id => {
            console.log(`🔄 [API] Intentando eliminar anuncio: ${id}`);
            return databases.deleteDocument(dbId, adsCollectionId, id)
                .then(() => {
                    console.log(`✅ [API] Anuncio ${id} eliminado exitosamente`);
                    return { id, success: true };
                })
                .catch(error => {
                    console.error(`❌ [API] Error eliminando anuncio ${id}:`, {
                        message: error.message,
                        code: error.code,
                        type: error.type
                    });
                    return {
                        id,
                        success: false,
                        error: error.message
                    };
                });
        });

        const results = await Promise.all(deletePromises);

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
