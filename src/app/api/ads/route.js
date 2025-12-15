import { NextResponse } from 'next/server';
import { databases, dbId, adsCollectionId } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { cleanDocuments } from '@/lib/response-cleaner';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const residentialId = searchParams.get('residential');
        const active = searchParams.get('active') !== 'false'; // Default to true if not specified
        const limitStr = searchParams.get('limit');
        const limit = limitStr ? parseInt(limitStr, 10) : 1000;

        const queries = [];

        if (residentialId) {
            queries.push(Query.equal("residencial", residentialId));
        }

        if (active) {
            queries.push(Query.equal("activo", true));
        }

        // Filter ads updated in the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        queries.push(Query.greaterThanEqual("$updatedAt", sevenDaysAgo));

        const sort = searchParams.get('sort') || '$createdAt';
        const order = searchParams.get('order') || 'desc';

        const params = [
            sort, order
        ];
        console.log("Sorting by:", params);

        queries.push(Query.limit(limit));

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

        const cleanedDocuments = cleanDocuments(response.documents);

        return NextResponse.json({
            documents: cleanedDocuments,
            total: response.total
        }, {
            headers: {
                // Short cache for ads as they might change status or new ones appear
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
