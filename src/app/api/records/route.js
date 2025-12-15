import { NextResponse } from 'next/server';
import { databases, dbId as defaultDbId } from '@/lib/appwrite-server';
import { cleanDocuments, cleanDocument } from '@/lib/response-cleaner';
import { Query } from 'node-appwrite';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const dbId = searchParams.get('dbId') || defaultDbId;
        const colId = searchParams.get('colId');
        const docId = searchParams.get('docId'); // Optional, for getDocument

        if (!colId) {
            return NextResponse.json({ error: 'Missing colId parameter' }, { status: 400 });
        }

        // Parse queries
        let queries = [];
        searchParams.forEach((value, key) => {
            if (key === 'queries' || key.startsWith('queries[')) {
                queries.push(value);
            }
        });

        // Robust Query Construction (from previous work)
        const safeQueries = [];
        queries.forEach(q => {
            if (typeof q === 'string' && q.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(q);
                    const { method, attribute, values } = parsed;
                    if (method && typeof Query[method] === 'function') {
                        if (method === 'limit' || method === 'offset') {
                            const val = (Array.isArray(values) && values.length > 0) ? values[0] : values;
                            if (val !== undefined) safeQueries.push(Query[method](parseInt(val, 10)));
                        } else if ((method === 'orderDesc' || method === 'orderAsc') && attribute) {
                            safeQueries.push(Query[method](attribute));
                        } else if (attribute) {
                            // Handle values for equal/notEqual etc.
                            // Some methods take single value, some array.
                            // Query.equal usually works with value or array.
                            // We pass 'values' which is array from JSON.
                            safeQueries.push(Query[method](attribute, values));
                        }
                    }
                } catch (e) {
                    console.warn('[API Records] Failed to parse JSON query:', q, e);
                }
            } else {
                // Generic regex parsers for standard string queries

                // equal("attr", ["val"]) - String
                const matchEqualString = q.match(/equal\("([^"]+)",\s*\["([^"]+)"\]\)/);
                if (matchEqualString && matchEqualString[1] && matchEqualString[2]) {
                    safeQueries.push(Query.equal(matchEqualString[1], matchEqualString[2]));
                    return;
                }

                // equal("attr", [true/false/123]) - Boolean/Number
                const matchEqualRaw = q.match(/equal\("([^"]+)",\s*\[(true|false|[0-9.]+)\]\)/);
                if (matchEqualRaw && matchEqualRaw[1] && matchEqualRaw[2]) {
                    let val = matchEqualRaw[2];
                    if (val === 'true') val = true;
                    if (val === 'false') val = false;
                    if (!isNaN(val)) val = Number(val);
                    safeQueries.push(Query.equal(matchEqualRaw[1], val));
                    return;
                }

                // notEqual("attr", ["val"]) - String
                const matchNotEqualString = q.match(/notEqual\("([^"]+)",\s*\["([^"]+)"\]\)/);
                if (matchNotEqualString && matchNotEqualString[1] && matchNotEqualString[2]) {
                    safeQueries.push(Query.notEqual(matchNotEqualString[1], matchNotEqualString[2]));
                    return;
                }

                // orderDesc("attr")
                const matchOrderDesc = q.match(/orderDesc\("([^"]+)"\)/);
                if (matchOrderDesc && matchOrderDesc[1]) {
                    safeQueries.push(Query.orderDesc(matchOrderDesc[1]));
                    return;
                }

                // orderAsc("attr")
                const matchOrderAsc = q.match(/orderAsc\("([^"]+)"\)/);
                if (matchOrderAsc && matchOrderAsc[1]) {
                    safeQueries.push(Query.orderAsc(matchOrderAsc[1]));
                    return;
                }

                // limit(n)
                const matchLimit = q.match(/limit\(([0-9]+)\)/);
                if (matchLimit && matchLimit[1]) {
                    safeQueries.push(Query.limit(parseInt(matchLimit[1], 10)));
                    return;
                }

                // offset(n)
                const matchOffset = q.match(/offset\(([0-9]+)\)/);
                if (matchOffset && matchOffset[1]) {
                    safeQueries.push(Query.offset(parseInt(matchOffset[1], 10)));
                    return;
                }

                // Generic string pass-through (risky but supported)
                safeQueries.push(q);
            }
        });

        let response;
        if (docId) {
            response = await databases.getDocument(dbId, colId, docId);
            const cleaned = cleanDocument(response);
            return NextResponse.json(cleaned, {
                headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
            });
        } else {
            response = await databases.listDocuments(dbId, colId, safeQueries);
            const cleaned = cleanDocuments(response.documents);
            return NextResponse.json({
                documents: cleaned,
                total: response.total
            }, {
                headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
            });
        }

    } catch (error) {
        console.error('[API Records] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message, details: error.response },
            { status: 500 }
        );
    }
}
