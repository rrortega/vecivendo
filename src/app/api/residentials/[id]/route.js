import { NextResponse } from 'next/server';
import { databases, dbId, residentialsCollectionId, adsCollectionId } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

// DELETE /api/residentials/[id] - Eliminar residencial con cascada
export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        console.log('🗑️ [API] Iniciando eliminación en cascada de residencial:', id);

        // 1. Buscar todos los anuncios del residencial
        const adsResponse = await databases.listDocuments(
            dbId,
            adsCollectionId,
            [Query.equal('residencial', id)]
        );

        const adsCount = adsResponse.total;
        console.log(`📋 [API] Encontrados ${adsCount} anuncios asociados al residencial`);

        // 2. Eliminar todos los anuncios asociados
        if (adsCount > 0) {
            const deletePromises = adsResponse.documents.map(ad => {
                console.log(`🔄 [API] Eliminando anuncio asociado: ${ad.$id}`);
                return databases.deleteDocument(dbId, adsCollectionId, ad.$id)
                    .then(() => {
                        console.log(`✅ [API] Anuncio ${ad.$id} eliminado`);
                        return { id: ad.$id, success: true };
                    })
                    .catch(error => {
                        console.error(`❌ [API] Error eliminando anuncio ${ad.$id}:`, error.message);
                        return { id: ad.$id, success: false, error: error.message };
                    });
            });

            const results = await Promise.all(deletePromises);
            const failed = results.filter(r => !r.success);

            if (failed.length > 0) {
                console.error(`❌ [API] ${failed.length} anuncios fallaron al eliminarse`);
                return NextResponse.json(
                    {
                        error: `No se pudieron eliminar ${failed.length} anuncios asociados`,
                        failed: failed
                    },
                    { status: 500 }
                );
            }

            console.log(`✅ [API] Todos los ${adsCount} anuncios eliminados exitosamente`);
        }

        // 3. Eliminar el residencial
        console.log('🔄 [API] Eliminando residencial:', id);
        await databases.deleteDocument(dbId, residentialsCollectionId, id);

        console.log('✅ [API] Residencial eliminado exitosamente');

        return NextResponse.json({
            success: true,
            id: id,
            adsDeleted: adsCount,
            message: `Residencial y ${adsCount} anuncio(s) asociado(s) eliminados exitosamente`
        });

    } catch (error) {
        console.error('❌ [API] Error en eliminación en cascada:', {
            id: params.id,
            message: error.message,
            code: error.code,
            type: error.type
        });

        return NextResponse.json(
            { error: error.message || 'Error al eliminar residencial' },
            { status: error.code || 500 }
        );
    }
}
