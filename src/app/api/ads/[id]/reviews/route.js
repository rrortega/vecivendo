import { NextResponse } from 'next/server';
import { databases, dbId } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { cleanDocuments } from '@/lib/response-cleaner';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);

        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        if (!id) {
            return NextResponse.json({ error: 'Missing ad ID' }, { status: 400 });
        }

        const queries = [
            Query.equal('anuncio_id', id),
            Query.orderDesc('$createdAt'),
            Query.limit(limit),
            Query.offset(offset)
        ];

        const response = await databases.listDocuments(
            dbId,
            'reviews',
            queries
        );

        const cleaned = cleanDocuments(response.documents);

        return NextResponse.json({
            documents: cleaned,
            total: response.total
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            }
        });

    } catch (error) {
        console.error('[API Reviews] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
