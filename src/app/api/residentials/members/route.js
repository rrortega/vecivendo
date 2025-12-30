import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const residentialId = searchParams.get('id');

        if (!residentialId) {
            return NextResponse.json({ error: 'Residential ID is required' }, { status: 400 });
        }

        const countApiUrl = process.env.PHONE_RESIDENTIAL_COUNT_API_URL;

        if (!countApiUrl) {
            return NextResponse.json({ error: 'Configuration error: Missing Count API URL' }, { status: 500 });
        }

        const response = await fetch(`${countApiUrl}?residential_id=${encodeURIComponent(residentialId)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Error fetching member count' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Ensure we return a consistent format
        return NextResponse.json({
            count: data.total || data.count || 0
        });

    } catch (error) {
        console.error('[API Residential Count] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
