import { NextResponse } from 'next/server';
import { databases, dbId } from '@/lib/appwrite-server';
import { client } from "@/lib/appwrite";
import { Query } from 'node-appwrite';

export const dynamic = 'force-dynamic';

const COLLECTION_ID = 'residenciales';

/**
 * GET /api/residentials/by-slug
 * Get residential by slug
 * 
 * Query params:
 * - slug: required - the residential slug
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (!slug) {
            return NextResponse.json(
                { error: 'slug is required' },
                { status: 400 }
            );
        }

        const response = await databases.listDocuments(
            dbId,
            COLLECTION_ID,
            [Query.equal('slug', slug), Query.limit(1)]
        );

        if (response.documents.length === 0) {
            return NextResponse.json(
                { error: 'Residential not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            residential: response.documents[0],
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('[API /api/residentials/by-slug] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch residential', message: error.message },
            { status: 500 }
        );
    }
}
