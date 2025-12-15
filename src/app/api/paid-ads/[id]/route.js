import { NextResponse } from 'next/server';
import { databases, dbId } from '@/lib/appwrite-server';

const PAID_ADS_COLLECTION_ID = 'anuncios_pago';

export async function GET(request, { params }) {
    const { id } = params;

    try {
        const document = await databases.getDocument(
            dbId,
            PAID_ADS_COLLECTION_ID,
            id
        );

        return NextResponse.json(document);
    } catch (error) {
        console.error('❌ [API] Error obteniendo anuncio pago:', error);

        const status = error.code || 500;
        const message = error.message || 'Error interno del servidor';

        return NextResponse.json(
            { error: message },
            { status: status }
        );
    }
}

export async function PATCH(request, { params }) {
    const { id } = params;
    try {
        const body = await request.json();
        const payload = { ...body };

        // Format dates if they exist and aren't ISO yet (standardizing)
        if (payload.fechaInicio) payload.fecha_inicio = new Date(payload.fechaInicio).toISOString();
        if (payload.fechaFin) payload.fecha_fin = new Date(payload.fechaFin).toISOString();
        if (payload.imagen) payload.image_url = payload.imagen; // map frontend key to db

        // Remove frontend-only keys that might cause errors if not in schema
        delete payload.fechaInicio;
        delete payload.fechaFin;
        delete payload.imagen;
        delete payload.$id;
        delete payload.$createdAt;
        delete payload.$updatedAt;
        delete payload.$permissions;
        delete payload.$databaseId;
        delete payload.$collectionId;

        // Remove attributes not yet in schema to prevent errors
        delete payload.categorias;
        delete payload.dailyImpact;

        const result = await databases.updateDocument(
            dbId,
            PAID_ADS_COLLECTION_ID,
            id,
            payload
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('❌ [API] Error actualizando anuncio:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = params;
    try {
        await databases.deleteDocument(
            dbId,
            PAID_ADS_COLLECTION_ID,
            id
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ [API] Error eliminando anuncio:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
