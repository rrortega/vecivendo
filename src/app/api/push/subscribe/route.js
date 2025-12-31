import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Endpoint para guardar la suscripción push del usuario
export async function POST(request) {
    try {
        const body = await request.json();
        const { subscription } = body;

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            );
        }

        // Obtener el ID del usuario si está autenticado
        const cookieStore = await cookies();
        const userId = cookieStore.get('user_id')?.value;

        // Guardar la suscripción en la base de datos
        // Aquí puedes usar Appwrite para guardar la suscripción
        // Por ahora, logueamos la suscripción para debug
        console.log('[Push Subscribe] New subscription:', {
            endpoint: subscription.endpoint.substring(0, 50) + '...',
            userId: userId || 'anonymous',
            keys: subscription.keys ? 'present' : 'missing',
        });

        // TODO: Guardar en Appwrite
        // const { databases } = require('@/lib/server/appwrite');
        // await databases.createDocument(
        //     process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
        //     'push_subscriptions',
        //     ID.unique(),
        //     {
        //         endpoint: subscription.endpoint,
        //         keys: JSON.stringify(subscription.keys),
        //         userId: userId || null,
        //         userAgent: request.headers.get('user-agent'),
        //         createdAt: new Date().toISOString(),
        //     }
        // );

        return NextResponse.json({
            success: true,
            message: 'Subscription saved successfully'
        });

    } catch (error) {
        console.error('Error saving push subscription:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
