import { NextResponse } from 'next/server';
import { tablesDB, dbId } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { cleanDocuments } from '@/lib/response-cleaner';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const response = await tablesDB.listRows({
            databaseId: dbId,
            tableId: 'categorias',
            queries: [
                Query.equal("activo", true),
                Query.orderAsc("orden")
            ]
        });

        const cleanedDocuments = cleanDocuments(response.rows);

        return NextResponse.json({
            documents: cleanedDocuments,
            total: response.total
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
            }
        });

    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
