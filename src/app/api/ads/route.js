import { NextResponse } from 'next/server';
import { databases, dbId, adsCollectionId } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';
import { cleanDocuments } from '@/lib/response-cleaner';
import { cookies } from 'next/headers';
import { Client, Account } from 'node-appwrite';

export const dynamic = 'force-dynamic';

// Helper to verify session and return user
async function verifyAuth(request) {
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
    return await account.get();
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const residentialId = searchParams.get('residential') || searchParams.get('residencial');
        const active = searchParams.get('active') !== 'false'; // Default to true if not specified
        const limitStr = searchParams.get('limit');
        const limit = limitStr ? parseInt(limitStr, 10) : 1000;
        const pageStr = searchParams.get('page');
        const page = pageStr ? parseInt(pageStr, 10) : 1;

        // Filtros adicionales
        const searchQuery = searchParams.get('search');
        const categoria = searchParams.get('categoria');
        const dateFilter = searchParams.get('date');

        const queries = [];

        if (residentialId) {
            queries.push(Query.equal("residencial", residentialId));
        }

        if (active) {
            queries.push(Query.equal("activo", true));
        }

        // Filtro por categoría
        if (categoria) {
            queries.push(Query.equal("categoria", categoria));
        }

        // NO agregamos Query.search aquí porque solo permite buscar en un campo
        // En su lugar, filtraremos después de obtener los resultados

        // Filtro por fecha específica
        if (dateFilter) {
            const startOfDay = new Date(dateFilter);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(dateFilter);
            endOfDay.setHours(23, 59, 59, 999);

            queries.push(Query.greaterThanEqual("$createdAt", startOfDay.toISOString()));
            queries.push(Query.lessThanEqual("$createdAt", endOfDay.toISOString()));
        } else {
            // Filter ads updated in the last 7 days (solo si no hay filtro de fecha)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            queries.push(Query.greaterThanEqual("last_capture", sevenDaysAgo));
        }

        const sort = searchParams.get('sort') || '$createdAt';
        const order = searchParams.get('order') || 'desc';

        // Paginación
        const offset = (page - 1) * limit;
        queries.push(Query.limit(limit));
        queries.push(Query.offset(offset));

        // Dynamic Sorting
        if (order === 'asc') {
            queries.push(Query.orderAsc(sort));
        } else {
            queries.push(Query.orderDesc(sort));
        }

        const response = await databases.listDocuments(
            dbId,
            adsCollectionId || 'anuncios',
            queries
        );

        let cleanedDocuments = cleanDocuments(response.documents);

        // Filtrar por búsqueda en múltiples campos (título, categoría, teléfono)
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            cleanedDocuments = cleanedDocuments.filter(ad => {
                const titulo = (ad.titulo || '').toLowerCase();
                const categoria = (ad.categoria || '').toLowerCase();
                const telefono = (ad.celular_anunciante || '').replace(/[\s\-\(\)]/g, '');
                const searchNormalized = searchQuery.replace(/[\s\-\(\)]/g, '');

                return titulo.includes(searchLower) ||
                    categoria.includes(searchLower) ||
                    telefono.includes(searchNormalized);
            });
        }

        return NextResponse.json({
            documents: cleanedDocuments,
            total: searchQuery ? cleanedDocuments.length : response.total
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            }
        });

    } catch (error) {
        console.error('Error fetching ads:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        // Verify authentication
        await verifyAuth(request);

        const body = await request.json();

        // Create document using server SDK with API key (bypasses permissions)
        const newDoc = await databases.createDocument(
            dbId,
            adsCollectionId || 'anuncios',
            ID.unique(),
            body
        );

        return NextResponse.json(newDoc, { status: 201 });
    } catch (error) {
        const status = error.message.includes('No autorizado') ? 403 : (error.message.includes('No autenticado') ? 401 : (error.code || 500));
        console.error('❌ [API] Error creando anuncio:', error.message);
        return NextResponse.json(
            { error: error.message || 'Error al crear el anuncio' },
            { status }
        );
    }
}
