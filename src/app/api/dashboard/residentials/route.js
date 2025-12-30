import { NextResponse } from 'next/server';
import { tablesDB } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

export const dynamic = 'force-dynamic';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;

export async function GET(request) {
    try {
        // Fetch all residentials (limit 100 or paginate if needed)
        const response = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: 'residenciales',
            queries: [
                Query.limit(100),
                Query.orderAsc('nombre') // Sort by name A-Z
            ]
        });

        return NextResponse.json(response.rows);
    } catch (error) {
        console.error('Error fetching residentials:', error);
        return NextResponse.json(
            { error: 'Failed to fetch residentials' },
            { status: 500 }
        );
    }
}
