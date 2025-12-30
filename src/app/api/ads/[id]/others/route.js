import { NextResponse } from 'next/server';
import { tablesDB, dbId } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { cleanDocuments } from '@/lib/response-cleaner';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'Missing ad ID' }, { status: 400 });
        }

        // 1. Fetch the source ad to identify the seller
        const ad = await tablesDB.getRow({ databaseId: dbId, tableId: 'anuncios', rowId: id });

        if (!ad) {
            return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
        }

        let queryField = 'celular_anunciante';
        let queryValue = ad.celular_anunciante;

        // 3. Query for other ads by the same seller
        // Optimization: We remove Query.notEqual('$id') and filter in memory to reduce DB load
        // We increase limit to 10 to ensure we have enough after filtering
        const response = await tablesDB.listRows({
            databaseId: dbId,
            tableId: 'anuncios',
            queries: [
                Query.equal(queryField, queryValue),
                Query.equal('activo', true),
                Query.limit(5), // Fetch a few more to allow for filtering
                Query.orderDesc('last_capture')
            ]
        });

        // 4. Filter out the current ad (if returned) and cleaning
        const filteredDocs = response.rows.filter(doc => doc.$id !== id);
        const slicedDocs = filteredDocs.slice(0, 6); // Take top 6
        const cleaned = cleanDocuments(slicedDocs);

        return NextResponse.json({
            documents: cleaned,
            total: response.total > 0 ? response.total - (response.rows.length - filteredDocs.length) : 0
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            }
        });

    } catch (error) {
        console.error('[API Seller Ads] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
