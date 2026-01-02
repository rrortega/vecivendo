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
 */
export async function POST(request) {
    try {
        const body = await request.json();
        let { userId, phone, token } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Se requiere phone' }, { status: 400 });
        }

        const rawPhone = phone.replace(/\D/g, '');
        if (!userId) userId = rawPhone;

        if (!token) {
            return NextResponse.json({ error: 'Se requiere el token FCM' }, { status: 400 });
        }

        // Función para limpiar targets expirados en un usuario específico
        // Solo elimina tokens diferentes al que se está registrando ahora
        const cleanupUserTargets = async (uid) => {
            try {
                console.log(`[RegisterTarget] Limpiando targets expirados para user: ${uid}`);
                const response = await users.listTargets({ userId: uid });

                // Eliminar solo los targets con tokens DIFERENTES al actual
                // Esto permite múltiples dispositivos pero elimina tokens expirados
                for (const t of response.targets) {
                    if (t.providerType === 'push' && t.identifier !== token) {
                        console.log(`[RegisterTarget] Eliminando target expirado ${t.$id} (token: ${t.identifier.substring(0, 20)}...)`);
                        try {
                            await users.deleteTarget({
                                userId: uid,
                                targetId: t.$id
                            });
                        } catch (delError) {
                            console.warn(`[RegisterTarget] Error eliminando target ${t.$id}:`, delError.message);
                        }
                    }
                }
            } catch (e) {
                if (e.code !== 404) console.warn(`[Cleanup] Error en ${uid}:`, e.message);
            }
        };

        // Función interna para realizar la operación de Appwrite
        const performOperation = async (currentUserId) => {
            // Calcular variante (52 <-> 521)
            const altUserId = currentUserId.startsWith('521') ? '52' + currentUserId.substring(3) :
                (currentUserId.startsWith('52') && currentUserId.length === 12 ? '521' + currentUserId.substring(2) : null);

            const providerId = 'firebase';

            // Verificar si este token ya existe para este usuario
            try {
                const existingTargets = await users.listTargets({ userId: currentUserId });
                const tokenExists = existingTargets.targets.some(
                    t => t.providerType === 'push' && t.identifier === token
                );

                if (tokenExists) {
                    console.log(`[RegisterTarget] Token ya existe para user ${currentUserId}, no se crea duplicado`);
                    return {
                        success: true,
                        workingUserId: currentUserId,
                        message: 'Token already registered'
                    };
                }
            } catch (e) {
                if (e.code !== 404) {
                    console.warn(`[RegisterTarget] Error verificando targets existentes:`, e.message);
                }
            }

            // Limpiar targets antiguos/expirados en AMBAS variantes
            await cleanupUserTargets(currentUserId);
            if (altUserId) await cleanupUserTargets(altUserId);

            // Crear nuevo target con ID único generado por Appwrite
            // Esto permite que el mismo usuario tenga múltiples dispositivos
            const created = await users.createTarget({
                userId: currentUserId,
                targetId: ID.unique(), // ID único por dispositivo/instalación
                providerType: 'push',
                identifier: token,
                providerId: providerId
            });

            return { ...created, workingUserId: currentUserId };
        };

        try {
            const result = await performOperation(userId);
            return NextResponse.json({
                success: true,
                action: 'completed',
                targetId: result.$id,
                providerId: result.providerId || 'firebase',
                workingUserId: result.workingUserId
            });
        } catch (appwriteError) {
            const isUserNotFoundError = appwriteError.message?.includes('User with the requested ID could not be found') || appwriteError.code === 404;
            if (isUserNotFoundError) {
                const altUserId = userId.startsWith('521') ? '52' + userId.substring(3) :
                    (userId.startsWith('52') && userId.length === 12 ? '521' + userId.substring(2) : null);

                if (altUserId) {
                    const result = await performOperation(altUserId);
                    return NextResponse.json({
                        success: true,
                        action: 'completed_with_retry',
                        targetId: result.$id,
                        providerId: result.providerId || 'firebase',
                        workingUserId: result.workingUserId,
                        usedAltId: true
                    });
                }
            }
            throw appwriteError;
        }
    } catch (error) {
        console.error('[RegisterTarget] Error:', error);
        return NextResponse.json({ error: 'Error al registrar push target', details: error.message }, { status: 500 });
    }
}

/**
 * Endpoint para eliminar un push target
 */
export async function DELETE(request) {
    try {
        const body = await request.json();
        let { userId, targetId, phone } = body;

        if (userId && userId.startsWith('52') && userId.length === 12 && !userId.startsWith('521')) {
            userId = '521' + userId.substring(2);
        }

        if (!userId) return NextResponse.json({ error: 'Se requiere userId' }, { status: 400 });

        const performDelete = async (currentUserId) => {
            let actualTargetId = targetId;
            if (!actualTargetId && phone) {
                let cleanPhone = phone.replace(/\D/g, '');
                if (cleanPhone.startsWith('52') && cleanPhone.length === 12 && !cleanPhone.startsWith('521')) {
                    cleanPhone = '521' + cleanPhone.substring(2);
                }
                const response = await users.listTargets({ userId: currentUserId });
                const pushTarget = response.targets.find(t => t.providerType === 'push' && t.providerId === 'firebase');
                actualTargetId = pushTarget ? pushTarget.$id : cleanPhone;
            }
            if (!actualTargetId) throw new Error('NOT_FOUND');
            await users.deleteTarget({
                userId: currentUserId,
                targetId: actualTargetId
            });
            return actualTargetId;
        };

        try {
            const deletedId = await performDelete(userId);
            return NextResponse.json({ success: true, action: 'deleted', targetId: deletedId });
        } catch (error) {
            const altUserId = userId.startsWith('521') ? '52' + userId.substring(3) :
                (userId.startsWith('52') && userId.length === 12 ? '521' + userId.substring(2) : null);
            if (altUserId) {
                const deletedId = await performDelete(altUserId);
                return NextResponse.json({ success: true, action: 'deleted_with_retry', targetId: deletedId });
            }
            if (error.message === 'NOT_FOUND' || error.code === 404) return NextResponse.json({ error: 'No se encontró' }, { status: 404 });
            throw error;
        }
    } catch (error) {
        return NextResponse.json({ error: 'Error al eliminar', details: error.message }, { status: 500 });
    }
}
