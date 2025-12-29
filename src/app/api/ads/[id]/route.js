import { NextResponse } from 'next/server';
import { databases, dbId, adsCollectionId } from '@/lib/appwrite-server';
import { cleanDocument } from '@/lib/response-cleaner';
import { cookies } from 'next/headers';
import { Client, Account } from 'node-appwrite';

// Helper to verify access (admin OR owner)
async function verifyAccess(request, adId) {
    const cookieStore = cookies();
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const allCookies = cookieStore.getAll();
    const sessionCookie = allCookies.find(c =>
        c.name === `a_session_${projectId}` ||
        c.name === `a_session_${projectId}_legacy` ||
        c.name === 'session'
    );

    let sessionToken = sessionCookie?.value;
    let isJWT = false;

    // Fallback to Authorization header (JWT)
    const authHeader = request.headers.get('Authorization');
    if (!sessionToken && authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.split(' ')[1];
        isJWT = true;
    }

    if (!sessionToken) {
        throw new Error('No autenticado. Sesión no encontrada.');
    }

    // Create client to verify
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

    if (isJWT) {
        client.setJWT(sessionToken);
    } else {
        client.setSession(sessionToken);
    }

    const account = new Account(client);
    const user = await account.get();

    // 1. Check if admin
    if (user.labels && user.labels.includes('admin')) {
        return { user, isAdmin: true };
    }

    // 2. Check if owner (phone must match)
    if (!adId) {
        throw new Error('ID de anuncio requerido para verificar propiedad.');
    }

    const ad = await databases.getDocument(dbId, adsCollectionId, adId);

    // Normalize phones for comparison
    const userPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
    const adPhone = ad.celular_anunciante ? ad.celular_anunciante.replace(/\D/g, '') : '';

    if (userPhone && adPhone && (userPhone === adPhone || userPhone.endsWith(adPhone) || adPhone.endsWith(userPhone))) {
        return { user, isAdmin: false, ad };
    }

    throw new Error('No autorizado. No tienes permiso para modificar este anuncio.');
}

// GET /api/ads/[id] - Obtener anuncio por ID
export async function GET(request, { params }) {
    try {
        const { id } = params;
        const document = await databases.getDocument(dbId, adsCollectionId, id);
        return NextResponse.json(cleanDocument(document));
    } catch (error) {
        console.error('❌ [API] Error obteniendo anuncio:', error);
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

        // Verify access (admin OR owner)
        await verifyAccess(request, id);

        console.log('✏️ [API] Actualizando anuncio:', id);

        const document = await databases.updateDocument(
            dbId,
            adsCollectionId,
            id,
            body
        );

        return NextResponse.json(document);
    } catch (error) {
        const status = error.message.includes('No autorizado') ? 403 : (error.message.includes('No autenticado') ? 401 : (error.code || 500));
        console.error('❌ [API] Error actualizando anuncio:', error.message);
        return NextResponse.json(
            { error: error.message || 'Error al actualizar anuncio' },
            { status }
        );
    }
}

// DELETE /api/ads/[id] - Eliminar anuncio
export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        // Verify access (admin OR owner)
        await verifyAccess(request, id);

        console.log('🗑️ [API] Eliminando anuncio:', id);

        await databases.deleteDocument(dbId, adsCollectionId, id);

        return NextResponse.json({ success: true, id });
    } catch (error) {
        const status = error.message.includes('No autorizado') ? 403 : (error.message.includes('No autenticado') ? 401 : (error.code || 500));
        console.error('❌ [API] Error eliminando anuncio:', error.message);
        return NextResponse.json(
            { error: error.message || 'Error al eliminar anuncio' },
            { status }
        );
    }
}
