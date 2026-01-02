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

        // El providerId constante usado para Firebase Cloud Messaging
        const expectedProviderId = 'firebase';

        // Función para buscar suscripción
        const findPushSubscription = async (currentUserId) => {
            const response = await users.listTargets({ userId: currentUserId });
            // Buscamos el target que sea exactamente el ID del usuario
            // Si el ID es diferente (como 'edb5...'), lo ignoramos para forzar el re-registro/limpieza
            return response.targets.find(target =>
                target.providerType === 'push' &&
                target.providerId === expectedProviderId &&
                target.$id === currentUserId
            );
        };

        // Si tenemos userId, intentamos buscar los targets del usuario
        if (userId) {
            try {
                let pushTarget = await findPushSubscription(userId);

                if (pushTarget) {
                    return NextResponse.json({
                        isSubscribed: true,
                        targetId: pushTarget.$id,
                        providerId: pushTarget.providerId,
                        identifier: pushTarget.identifier
                    });
                }
            } catch (error) {
                const isUserNotFoundError = error.message?.includes('User with the requested ID could not be found') || error.code === 404;
                if (isUserNotFoundError) {
                    console.log('[CheckSubscription] Usuario no encontrado, probando variante genérica...');

                    const countryCodes = ['52', '1', '34', '54', '55', '57', '51', '56', '58', '502', '503', '504', '505', '506', '507', '591', '593', '595', '598'];
                    let altUserId = null;

                    for (const cc of countryCodes.sort((a, b) => b.length - a.length)) {
                        if (userId.startsWith(cc)) {
                            const rest = userId.substring(cc.length);
                            altUserId = rest.startsWith('1') ? cc + rest.substring(1) : cc + '1' + rest;
                            break;
                        }
                    }

                    if (altUserId && altUserId !== userId) {
                        try {
                            const pushTarget = await findPushSubscription(altUserId);
                            if (pushTarget) {
                                return NextResponse.json({
                                    isSubscribed: true,
                                    targetId: pushTarget.$id,
                                    providerId: pushTarget.providerId,
                                    identifier: pushTarget.identifier,
                                    usedAltId: true
                                });
                            }
                        } catch (retryError) {
                            console.log('[CheckSubscription] Error en reintento de verificación');
                        }
                    }
                }
                console.log('[CheckSubscription] Error final listing targets:', error.message);
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
