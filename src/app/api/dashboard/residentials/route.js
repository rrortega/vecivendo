import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

export const dynamic = 'force-dynamic';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;

export async function GET(request) {
    try {
        // Fetch all residentials (limit 100 or paginate if needed)
        const response = await databases.listDocuments(
            DATABASE_ID,
            'residenciales',
            [
                Query.limit(100),
                Query.orderAsc('nombre') // Sort by name A-Z
            ]
        );

        return NextResponse.json(response.documents);
    } catch (error) {
        console.error('Error fetching residentials:', error);
        return NextResponse.json(
            { error: 'Failed to fetch residentials' },
            { status: 500 }
        );
    }
}
