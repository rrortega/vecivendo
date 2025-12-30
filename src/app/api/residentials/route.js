import { NextResponse } from 'next/server';
import { tablesDB, dbId, residentialsTableId } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { cleanDocument } from '@/lib/response-cleaner';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');
        const id = searchParams.get('id');

        if (!slug && !id) {
            return NextResponse.json({ error: 'Missing slug or id parameter' }, { status: 400 });
        }

        let document = null;

        // Fetch by ID directly if provided (more efficient)
        if (id) {
            document = await tablesDB.getRow({ databaseId: dbId, tableId: residentialsTableId, rowId: id });
        } else if (slug) {
            // Fetch by Slug
            const response = await tablesDB.listRows({
                databaseId: dbId,
                tableId: residentialsTableId,
                queries: [Query.equal('slug', slug)]
            });
            if (response.rows.length > 0) {
                document = response.rows[0];
            }
        }

        if (!document) {
            return NextResponse.json({ error: 'Residential not found' }, { status: 404 });
        }


        const cleanedDocument = cleanDocument(document);

        // Cache response for some time as residential data doesn't change often
        return NextResponse.json(cleanedDocument, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            }
        });

    } catch (error) {
        console.error('Error fetching residential:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
