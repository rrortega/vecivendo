import { NextResponse } from 'next/server';
import { databases, dbId, adsCollectionId } from '@/lib/appwrite-server';

// GET /api/ads/[id] - Obtener anuncio por ID
export async function GET(request, { params }) {
    try {
        const { id } = params;

        console.log('🔍 [API] Obteniendo anuncio:', id);

        const document = await databases.getDocument(dbId, adsCollectionId, id);

        console.log('✅ [API] Anuncio obtenido:', document.titulo);

        return NextResponse.json(document);

    } catch (error) {
        console.error('❌ [API] Error obteniendo anuncio:', {
            id: params.id,
            message: error.message,
            code: error.code
        });

        return NextResponse.json(
            { error: error.message || 'Error al obtener anuncio' },
            { status: error.code || 500 }
        );
    }
}

// PATCH /api/ads/[id] - Actualizar anuncio
export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();

        console.log('✏️ [API] Actualizando anuncio:', id);

        const document = await databases.updateDocument(
            dbId,
            adsCollectionId,
            id,
            body
        );

        console.log('✅ [API] Anuncio actualizado exitosamente');

        return NextResponse.json(document);

    } catch (error) {
        console.error('❌ [API] Error actualizando anuncio:', {
            id: params.id,
            message: error.message,
            code: error.code
        });

        return NextResponse.json(
            { error: error.message || 'Error al actualizar anuncio' },
            { status: error.code || 500 }
        );
    }
}

// DELETE /api/ads/[id] - Eliminar anuncio
export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        console.log('🗑️ [API] Eliminando anuncio:', id);

        await databases.deleteDocument(dbId, adsCollectionId, id);

        console.log('✅ [API] Anuncio eliminado exitosamente');

        return NextResponse.json({ success: true, id });

    } catch (error) {
        console.error('❌ [API] Error eliminando anuncio:', {
            id: params.id,
            message: error.message,
            code: error.code,
            type: error.type
        });

        return NextResponse.json(
            { error: error.message || 'Error al eliminar anuncio' },
            { status: error.code || 500 }
        );
    }
}
