import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Endpoint para cancelar la suscripción push
export async function POST(request) {
    try {
        const body = await request.json();
        const { endpoint } = body;

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Endpoint is required' },
                { status: 400 }
            );
        }

        console.log('[Push Unsubscribe] Removing subscription:', endpoint.substring(0, 50) + '...');

        // TODO: Eliminar de Appwrite
        // const { databases } = require('@/lib/server/appwrite');
        // const subscriptions = await databases.listDocuments(
        //     process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
        //     'push_subscriptions',
        //     [Query.equal('endpoint', endpoint)]
        // );
        // if (subscriptions.documents.length > 0) {
        //     await databases.deleteDocument(
        //         process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
        //         'push_subscriptions',
        //         subscriptions.documents[0].$id
        //     );
        // }

        return NextResponse.json({
            success: true,
            message: 'Subscription removed successfully'
        });

    } catch (error) {
        console.error('Error removing push subscription:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
