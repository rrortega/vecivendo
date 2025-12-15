import { NextResponse } from 'next/server';
import { databases, dbId, residentialsCollectionId } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { cleanDocuments } from '@/lib/response-cleaner';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

// Cache slug resolution indefinitely (or until manual revalidation) as slugs rarely change
const resolveResidentialId = unstable_cache(
    async (slugOrId) => {
        // Simple heuristic check: ID is 20 chars, Slug usually not. 
        // If we want to be safe, we query.

        // 1. Try to fetch residential by slug
        const resDocs = await databases.listDocuments(
            dbId,
            residentialsCollectionId,
            [Query.equal('slug', slugOrId)]
        );

        if (resDocs.documents.length > 0) {
            return resDocs.documents[0].$id;
        }

        // 2. If not found by slug, maybe it IS an ID? 
        // We could verify existence or just return it if it looks like an ID.
        // Let's assume if not found as slug, and length is 20, it's an ID.
        if (slugOrId.length === 20) return slugOrId;

        return null;
    },
    ['residential-slug-resolve'],
    { revalidate: 86400, tags: ['residentials'] } // 24 hours cache
);


export async function GET(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
        }

        // 1. Resolve Identifier (Slug vs ID) with Cache
        let residentialId = id;

        // Always try to resolve via cache first to cover both slug and ensuring ID maps to something if we wanted to be strict.
        // But mainly to handle slug -> id efficiently.
        // We trust the cache function to handle the lookup.
        const resolvedId = await resolveResidentialId(id);

        if (resolvedId) {
            residentialId = resolvedId;
        } else {
            // If resolution failed and it doesn't look like an ID, 404.
            // If it looks like an ID but wasn't found as a slug, resolveResidentialId would return it (logic above).
            // But if resolveResidentialId returns null, it means it's not a known slug and maybe not a valid ID format check passed inside?
            // Actually my logic above: if not slug, check length 20. If 20 return input. Else null.
            return NextResponse.json({ error: 'Residential not found' }, { status: 404 });
        }

        // 2. Query Notices
        const queries = [
            Query.equal('residencial', residentialId),
            Query.orderDesc('$createdAt'),
            Query.limit(100) // Increase limit to fetch enough candidates before client-side filtering
        ];

        const response = await databases.listDocuments(
            dbId,
            'avisos_comunidad',
            queries
        );

        // 3. Filter active notices (Server-side logic)
        const now = new Date();
        const activeNotices = response.documents.filter(doc => {
            if (doc.duracion_dias && doc.$createdAt) {
                try {
                    const createdDate = new Date(doc.$createdAt);
                    const expirationDate = new Date(createdDate.getTime() + (doc.duracion_dias * 24 * 60 * 60 * 1000));
                    return now <= expirationDate;
                } catch (e) {
                    console.warn(`Invalid date for notice ${doc.$id}`, e);
                    return true; // Keep if uncertain
                }
            }
            return true; // No expiration defined
        });

        // 4. Return cleaned documents
        const cleaned = cleanDocuments(activeNotices);

        return NextResponse.json({
            documents: cleaned,
            total: activeNotices.length,
            residentialId: residentialId
        }, {
            headers: {
                // Keep minimal caching for the list itself, but we optimized the slug resolution which was the bottleneck
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            }
        });

    } catch (error) {
        console.error('[API Notices] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
