import { NextResponse } from 'next/server';
import { cleanDocument, cleanDocuments } from '@/lib/response-cleaner';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

/**
 * BFF Proxy for Appwrite requests
 * This proxies all requests from /api/baas/* to Appwrite's API
 * Benefits:
 * - Hides Appwrite endpoint from client
 * - Uses server-side API key for authentication
 * - Allows for caching, rate limiting, logging
 */


async function proxyRequest(request, params) {
    try {
        const { path } = params;
        const pathString = Array.isArray(path) ? path.join('/') : path;
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();
        const appwriteUrl = `${APPWRITE_ENDPOINT}/${pathString}${queryString ? `?${queryString}` : ''}`;
        console.log('[BaaS Proxy] Forwarding to:', appwriteUrl);

        // Filter and forward headers
        const headers = new Headers();

        // Critical: Forward Cookie for Auth
        const cookie = request.headers.get('cookie');
        if (cookie) headers.set('Cookie', cookie);

        // Forward Content-Type (important for boundary in multipart)
        const contentType = request.headers.get('content-type');
        if (contentType) headers.set('Content-Type', contentType);

        // Forward other useful headers
        const auth = request.headers.get('authorization'); // JWT if used
        if (auth) headers.set('Authorization', auth);

        const userAgent = request.headers.get('user-agent');
        if (userAgent) headers.set('User-Agent', userAgent);

        // Appwrite Project
        headers.set('X-Appwrite-Project', APPWRITE_PROJECT);

        // Forward other X-Appwrite headers from client (Locale, Mode, etc)
        request.headers.forEach((value, key) => {
            if (key.startsWith('x-appwrite-') && key !== 'x-appwrite-project' && key !== 'x-appwrite-key') {
                headers.set(key, value);
            }
        });

        // Fetch options
        const fetchOptions = {
            method: request.method,
            headers: headers,
            // Forward body stream directly (supports JSON, FormData, etc.)
            // cast to any to avoid TS issues if this were TS, NextRequest body is ReadableStream
            body: request.body,
            // @ts-ignore
            duplex: 'half' // Required for streaming bodies in some fetch implementations
        };

        const response = await fetch(appwriteUrl, fetchOptions);

        // Handle Response
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[BaaS Proxy] ${request.method} ${pathString} Error ${response.status}:`, errorText.substring(0, 200));
            try {
                // Try to parse as JSON to return structured error
                const errorJson = JSON.parse(errorText);
                return NextResponse.json(errorJson, { status: response.status });
            } catch {
                return NextResponse.json(
                    { error: 'Upstream error', details: errorText },
                    { status: response.status }
                );
            }
        }

        // Forward response data
        // We can just pipe the response body? Or parse JSON?
        // Parsing JSON is safer for modification/logging, but piping stream is more efficient.
        // For now, let's process as JSON or Text to allow debugging/caching.
        // But for files (Image View), parsing as JSON fails.
        // If content-type is json, parse. Else blob/text.

        const resContentType = response.headers.get('content-type') || '';
        if (resContentType.includes('application/json')) {
            let data = await response.json();

            // Apply response cleaning (remove system attributes and nulls)
            if (data && typeof data === 'object') {
                if (Array.isArray(data.documents)) {
                    // It's a list response (Databases)
                    data.documents = cleanDocuments(data.documents);
                } else if (Array.isArray(data.rows)) {
                    // It's a list response (TablesDB)
                    data.rows = cleanDocuments(data.rows);
                } else if (data.$id) {
                    // It's likely a single resource
                    data = cleanDocument(data);
                }
            }

            return NextResponse.json(data, {
                status: response.status,
                headers: {
                    'Cache-Control': request.method === 'GET' ? 'public, s-maxage=10, stale-while-revalidate=59' : 'no-store'
                }
            });
        } else {
            // For non-JSON (e.g. downloads, images), return stream/blob
            const blob = await response.blob();
            return new NextResponse(blob, {
                status: response.status,
                headers: {
                    'Content-Type': resContentType,
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        }

    } catch (error) {
        console.error('[BaaS Proxy] Fatal Error:', error);
        return NextResponse.json(
            { error: 'Proxy implementation error', message: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request, { params }) {
    return proxyRequest(request, params);
}

export async function POST(request, { params }) {
    return proxyRequest(request, params);
}

export async function PUT(request, { params }) {
    return proxyRequest(request, params);
}

export async function PATCH(request, { params }) {
    return proxyRequest(request, params);
}

export async function DELETE(request, { params }) {
    return proxyRequest(request, params);
}
