import { NextResponse } from 'next/server';
import { Client, Users } from 'node-appwrite';

export const dynamic = 'force-dynamic';

// Inicializar cliente de Appwrite
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

/**
 * Endpoint para verificar si el usuario tiene un push target registrado
 * GET /api/push/check-subscription?userId=xxx&phone=xxx
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        let userId = searchParams.get('userId');
        const phone = searchParams.get('phone');

        if (!userId && !phone) {
            return NextResponse.json(
                { error: 'Se requiere userId o phone' },
                { status: 400 }
            );
        }

        // Si no hay userId pero hay teléfono, lo derivamos
        if (!userId && phone) {
            userId = phone.replace(/\D/g, '');
        }

        // Normalización para México (Appwrite usa 521 + 10 dígitos)
        if (userId && userId.startsWith('52') && userId.length === 12 && !userId.startsWith('521')) {
            userId = '521' + userId.substring(2);
        }

        // Construir el providerId esperado: teléfono + "PUSH"
        // Limpiamos el teléfono para que solo tenga números
        const cleanPhone = phone ? phone.replace(/\D/g, '') : (userId ? userId : null);
        const expectedProviderId = cleanPhone ? `${cleanPhone}PUSH` : null;

        // Si tenemos userId, intentamos buscar los targets del usuario
        if (userId) {
            try {
                const targets = await users.listTargets(userId);

                // Buscar si existe un target de tipo push
                const pushTarget = targets.targets.find(target =>
                    target.providerType === 'push'
                );

                if (pushTarget) {
                    return NextResponse.json({
                        isSubscribed: true,
                        targetId: pushTarget.$id,
                        providerId: pushTarget.providerId,
                        identifier: pushTarget.identifier
                    });
                }
            } catch (error) {
                console.log('[CheckSubscription] Error listing targets:', error.message);
            }
        }

        // No se encontró suscripción
        return NextResponse.json({
            isSubscribed: false,
            expectedProviderId
        });

    } catch (error) {
        console.error('[CheckSubscription] Error:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
