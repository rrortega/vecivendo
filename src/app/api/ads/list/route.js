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
                queries.push(Query.orderDesc('$updatedAt'));
                break;
        }

        // Pagination
        queries.push(Query.limit(limit));
        queries.push(Query.offset((page - 1) * limit));

        // Category filter
        if (category) {
            queries.push(Query.equal('categoria_slug', category.toLowerCase()));
        }

        // Search filter
        if (search) {
            queries.push(Query.search('titulo', search));
        }

        // Execute query
        const response = await databases.listDocuments(dbId, COLLECTION_ID, queries);

        return NextResponse.json({
            documents: response.documents,
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
