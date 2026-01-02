import { NextResponse } from 'next/server';
import { Client, Users, Messaging, ID } from 'node-appwrite';

export const dynamic = 'force-dynamic';

// Inicializar cliente de Appwrite
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);
const messaging = new Messaging(client);

/**
 * Endpoint para registrar un push target (token FCM) para el usuario
 * POST /api/push/register-target
 * Body: { userId, phone, token }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        let { userId, phone, token } = body;

        if (!phone) {
            return NextResponse.json(
                { error: 'Se requiere phone' },
                { status: 400 }
            );
        }

        // Limpiar teléfono de entrada para uso interno
        const rawPhone = phone.replace(/\D/g, '');

        // Si no hay userId enviado, lo derivamos del teléfono
        if (!userId) {
            userId = rawPhone;
        }

        if (!token) {
            return NextResponse.json(
                { error: 'Se requiere el token FCM' },
                { status: 400 }
            );
        }

        // Función interna para realizar la operación de Appwrite
        const performOperation = async (currentUserId) => {
            console.log(`[RegisterTarget] Intentando operación para userId: ${currentUserId}`);

            // El providerId siempre debe ser el ID del usuario + PUSH para consistencia
            const providerId = `${currentUserId}PUSH`;

            // Primero verificamos si ya existe un target con este providerId
            const existingTargets = await users.listTargets(currentUserId);
            const existingPushTarget = existingTargets.targets.find(
                target => target.providerType === 'push' && target.providerId === providerId
            );

            if (existingPushTarget) {
                console.log('[RegisterTarget] Actualizando target existente:', existingPushTarget.$id);
                const updated = await users.updateTarget(
                    currentUserId,
                    existingPushTarget.$id,
                    token
                );
                return { ...updated, workingUserId: currentUserId };
            }

            // Crear nuevo target
            const targetId = ID.unique();
            const created = await users.createTarget(
                currentUserId,
                targetId,
                'push',
                token,
                providerId
            );
            return { ...created, workingUserId: currentUserId };
        };

        try {
            // 1. Intentar con el userId recibido (tal cual viene del frontend)
            const result = await performOperation(userId);

            return NextResponse.json({
                success: true,
                action: 'completed',
                targetId: result.$id,
                providerId: result.providerId,
                workingUserId: result.workingUserId
            });

        } catch (appwriteError) {
            // 2. Si el error es "User not found", intentamos con la variante de ID alternativo (normalización de México)
            const isUserNotFoundError = appwriteError.message?.includes('User with the requested ID could not be found') || appwriteError.code === 404;

            if (isUserNotFoundError) {
                console.log('[RegisterTarget] Usuario no encontrado, intentando con variante de ID...');

                let altUserId = null;
                // Si es México (52) y no tiene el 1, intentamos ponérselo (521)
                if (userId.startsWith('52') && userId.length === 12 && !userId.startsWith('521')) {
                    altUserId = '521' + userId.substring(2);
                }
                // Al revés: si trae el 1 pero no existe, intentar sin el 1
                else if (userId.startsWith('521') && userId.length === 13) {
                    altUserId = '52' + userId.substring(3);
                }

                if (altUserId && altUserId !== userId) {
                    try {
                        console.log(`[RegisterTarget] Reintentando con ID alternativo: ${altUserId}`);
                        const result = await performOperation(altUserId);
                        return NextResponse.json({
                            success: true,
                            action: 'completed_with_retry',
                            targetId: result.$id,
                            providerId: result.providerId,
                            workingUserId: result.workingUserId,
                            usedAltId: true
                        });
                    } catch (retryError) {
                        console.error('[RegisterTarget] Error en reintento:', retryError);
                        throw retryError;
                    }
                }
            }

            // Si es un error de target duplicado, lo manejamos de forma amigable
            if (appwriteError.code === 409) {
                return NextResponse.json({
                    success: true,
                    action: 'already_exists',
                    message: 'Target ya registrado',
                    workingUserId: userId // Asumimos que el ID original era el correcto
                });
            }

            throw appwriteError;
        }
    } catch (error) {
        console.error('[RegisterTarget] Error:', error);
        return NextResponse.json(
            { error: 'Error al registrar push target', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Endpoint para eliminar un push target
 * DELETE /api/push/register-target
 * Body: { userId, targetId } o { userId, phone }
 */
export async function DELETE(request) {
    try {
        const body = await request.json();
        let { userId, targetId, phone } = body;

        // Normalización para México (Appwrite usa 521 + 10 dígitos)
        if (userId && userId.startsWith('52') && userId.length === 12 && !userId.startsWith('521')) {
            userId = '521' + userId.substring(2);
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'Se requiere userId' },
                { status: 400 }
            );
        }

        const performDelete = async (currentUserId) => {
            let actualTargetId = targetId;

            // Si no tenemos targetId pero tenemos phone, buscamos el target
            if (!actualTargetId && phone) {
                let cleanPhone = phone.replace(/\D/g, '');

                // Normalización para México (521)
                if (cleanPhone.startsWith('52') && cleanPhone.length === 12 && !cleanPhone.startsWith('521')) {
                    cleanPhone = '521' + cleanPhone.substring(2);
                }

                const providerId = `${cleanPhone}PUSH`;

                const targets = await users.listTargets(currentUserId);
                const pushTarget = targets.targets.find(
                    target => target.providerType === 'push' && target.providerId === providerId
                );

                if (pushTarget) {
                    actualTargetId = pushTarget.$id;
                }
            }

            if (!actualTargetId) {
                throw new Error('NOT_FOUND');
            }

            await users.deleteTarget(currentUserId, actualTargetId);
            return actualTargetId;
        };

        try {
            const deletedId = await performDelete(userId);
            return NextResponse.json({
                success: true,
                action: 'deleted',
                targetId: deletedId
            });
        } catch (error) {
            const isUserNotFoundError = error.message?.includes('User with the requested ID could not be found') || error.code === 404;

            if (isUserNotFoundError) {
                console.log('[RegisterTarget] Usuario no encontrado en DELETE, intentando con variante de ID...');

                let altUserId = null;
                if (userId.startsWith('52') && userId.length === 12 && !userId.startsWith('521')) {
                    altUserId = '521' + userId.substring(2);
                } else if (userId.startsWith('521') && userId.length === 13) {
                    altUserId = '52' + userId.substring(3);
                }

                if (altUserId && altUserId !== userId) {
                    try {
                        console.log(`[RegisterTarget] Reintentando DELETE con ID alternativo: ${altUserId}`);
                        const deletedId = await performDelete(altUserId);
                        return NextResponse.json({
                            success: true,
                            action: 'deleted_with_retry',
                            targetId: deletedId,
                            usedAltId: true
                        });
                    } catch (retryError) {
                        if (retryError.message === 'NOT_FOUND') {
                            return NextResponse.json({ error: 'No se encontró el target' }, { status: 404 });
                        }
                        throw retryError;
                    }
                }
            }

            if (error.message === 'NOT_FOUND') {
                return NextResponse.json({ error: 'No se encontró el target' }, { status: 404 });
            }
            throw error;
        }

    } catch (error) {
        console.error('[RegisterTarget] Error al eliminar:', error);
        return NextResponse.json(
            { error: 'Error al eliminar push target', details: error.message },
            { status: 500 }
        );
    }
}
