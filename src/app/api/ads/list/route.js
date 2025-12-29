import { NextResponse } from 'next/server';
import { databases, dbId } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
export const dynamic = 'force-dynamic';

const COLLECTION_ID = 'anuncios';

/**
 * GET /api/ads/list
 * List, paginate, and filter free ads
 * 
 * Query params:
 * - residentialId: required - filter by residential
 * - category: optional - filter by category slug
 * - search: optional - search in title
 * - sort: optional - 'recent' (default), 'price_asc', 'price_desc'
 * - page: optional - page number (default 1)
 * - limit: optional - items per page (default 24, max 100)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const residentialId = searchParams.get('residentialId');
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const sort = searchParams.get('sort') || 'recent';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));

        if (!residentialId) {
            return NextResponse.json(
                { error: 'residentialId is required' },
                { status: 400 }
            );
        }

        // Build queries
        const queries = [
            Query.equal('residencial', residentialId),
            Query.equal('activo', true),
            // Filter ads older than 7 days
            Query.greaterThanEqual('last_capture', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        ];

        // Sort order
        switch (sort) {
            case 'price_asc':
                queries.push(Query.orderAsc('precio'));
                break;
            case 'price_desc':
                queries.push(Query.orderDesc('precio'));
                break;
            case 'recent':
            default:
                queries.push(Query.orderDesc('last_capture'));
                break;
        }

        // Pagination
        queries.push(Query.limit(limit));
        queries.push(Query.offset((page - 1) * limit));

        // Category filter
        if (category) {
            const catLower = category.toLowerCase();

            // Try to find the real category name to be more robust with the 'categoria' field
            let catNameForQuery = catLower.charAt(0).toUpperCase() + catLower.slice(1).replace(/-/g, ' ');

            try {
                const catCollectionId = 'categorias';
                const catDocs = await databases.listDocuments(dbId, catCollectionId, [
                    Query.equal('slug', catLower),
                    Query.limit(1)
                ]);

                if (catDocs.documents.length > 0) {
                    catNameForQuery = catDocs.documents[0].nombre;
                }
            } catch (catError) {
                console.warn('[API /api/ads/list] Could not resolve category name from slug:', catError.message);
            }

            const fallbackName = catLower.charAt(0).toUpperCase() + catLower.slice(1).replace(/-/g, ' ');

            queries.push(Query.or([
                Query.equal('categoria_slug', catLower),
                Query.equal('categoria', catNameForQuery),
                Query.equal('categoria', fallbackName)
            ]));
        }

        // Search filter
        if (search) {
            queries.push(Query.search('titulo', search));
        }

        // Execute query
        const response = await databases.listDocuments(dbId, COLLECTION_ID, queries);

        return NextResponse.json({
            documents: response.documents.map(d => {
                // delete d['$createdAt'];
                delete d['$updatedAt'];
                delete d['$permissions'];
                delete d['$databaseId'];
                delete d['$collectionId'];
                delete d['$sequence'];
                delete d['whatsapp_group_id']
                delete d['imagenes_originales'];
                delete d['imagen_ia'];
                delete d['residencial'];
                delete d['celular_anunciante'];
                for (var k in d) {
                    if (null == d[k])
                        delete d[k]
                }
                return d;
            }),
            total: response.total,
            page,
            limit,
            hasMore: (page * limit) < response.total,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
            },
        });
    } catch (error) {
        console.error('[API /api/ads/list] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch ads', message: error.message },
            { status: 500 }
        );
    }
}
