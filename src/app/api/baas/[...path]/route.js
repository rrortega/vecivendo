import { NextResponse } from 'next/server';

const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

/**
 * BFF Proxy for Appwrite requests
 * This proxies all requests from /api/baas/* to Appwrite's API
 * Benefits:
 * - Hides Appwrite endpoint from client
 * - Uses server-side API key for authentication
 * - Allows for caching, rate limiting, logging
 */

export async function GET(request, { params }) {
    try {
        const { path } = params;
        const pathString = Array.isArray(path) ? path.join('/') : path;

        // Get query string from the request
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        // Build the Appwrite URL
        const appwriteUrl = `${APPWRITE_ENDPOINT}/${pathString}${queryString ? `?${queryString}` : ''}`;

        // Forward the request to Appwrite
        const response = await fetch(appwriteUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': APPWRITE_PROJECT,
                'X-Appwrite-Key': APPWRITE_API_KEY,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[BaaS Proxy] Appwrite error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Upstream error', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return with cache headers for static-ish data
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
            },
        });
    } catch (error) {
        console.error('[BaaS Proxy] Error:', error);
        return NextResponse.json(
            { error: 'Proxy error', message: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request, { params }) {
    try {
        const { path } = params;
        const pathString = Array.isArray(path) ? path.join('/') : path;

        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        const body = await request.json().catch(() => null);

        const appwriteUrl = `${APPWRITE_ENDPOINT}/${pathString}${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(appwriteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': APPWRITE_PROJECT,
                'X-Appwrite-Key': APPWRITE_API_KEY,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[BaaS Proxy] Appwrite error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Upstream error', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[BaaS Proxy] Error:', error);
        return NextResponse.json(
            { error: 'Proxy error', message: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(request, { params }) {
    try {
        const { path } = params;
        const pathString = Array.isArray(path) ? path.join('/') : path;

        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        const body = await request.json().catch(() => null);

        const appwriteUrl = `${APPWRITE_ENDPOINT}/${pathString}${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(appwriteUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': APPWRITE_PROJECT,
                'X-Appwrite-Key': APPWRITE_API_KEY,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[BaaS Proxy] Appwrite error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Upstream error', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[BaaS Proxy] Error:', error);
        return NextResponse.json(
            { error: 'Proxy error', message: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { path } = params;
        const pathString = Array.isArray(path) ? path.join('/') : path;

        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        const appwriteUrl = `${APPWRITE_ENDPOINT}/${pathString}${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(appwriteUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': APPWRITE_PROJECT,
                'X-Appwrite-Key': APPWRITE_API_KEY,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[BaaS Proxy] Appwrite error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Upstream error', details: errorText },
                { status: response.status }
            );
        }

        // DELETE might return empty or JSON
        const text = await response.text();
        if (text) {
            try {
                return NextResponse.json(JSON.parse(text));
            } catch {
                return NextResponse.json({ success: true });
            }
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[BaaS Proxy] Error:', error);
        return NextResponse.json(
            { error: 'Proxy error', message: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        const { path } = params;
        const pathString = Array.isArray(path) ? path.join('/') : path;

        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        const body = await request.json().catch(() => null);

        const appwriteUrl = `${APPWRITE_ENDPOINT}/${pathString}${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(appwriteUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': APPWRITE_PROJECT,
                'X-Appwrite-Key': APPWRITE_API_KEY,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[BaaS Proxy] Appwrite error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Upstream error', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[BaaS Proxy] Error:', error);
        return NextResponse.json(
            { error: 'Proxy error', message: error.message },
            { status: 500 }
        );
    }
}
