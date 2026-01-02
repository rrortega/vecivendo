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

        // Si no hay userId, lo derivamos del teléfono (teléfono sin +)
        if (!userId) {
            userId = phone.replace(/\D/g, '');
        }

        // Normalización para México (Appwrite usa 521 + 10 dígitos)
        if (userId && userId.startsWith('52') && userId.length === 12 && !userId.startsWith('521')) {
            userId = '521' + userId.substring(2);
        }

        if (!token) {
            return NextResponse.json(
                { error: 'Se requiere el token FCM' },
                { status: 400 }
            );
        }

        // Limpiar el teléfono y construir el providerId
        const cleanPhone = phone.replace(/\D/g, '');
        const providerId = `${cleanPhone}PUSH`;

        console.log('[RegisterTarget] Registrando push target:', {
            userId,
            providerId,
            tokenPreview: token.substring(0, 30) + '...'
        });

        try {
            // Primero verificamos si ya existe un target con este providerId
            const existingTargets = await users.listTargets(userId);
            const existingPushTarget = existingTargets.targets.find(
                target => target.providerType === 'push' && target.providerId === providerId
            );

            if (existingPushTarget) {
                // Si ya existe, actualizamos el token (identifier)
                console.log('[RegisterTarget] Actualizando target existente:', existingPushTarget.$id);

                const updatedTarget = await users.updateTarget(
                    userId,
                    existingPushTarget.$id,
                    token // nuevo identifier (token FCM)
                );

                return NextResponse.json({
                    success: true,
                    action: 'updated',
                    targetId: updatedTarget.$id,
                    providerId: updatedTarget.providerId
                });
            }

            // Crear nuevo target
            const targetId = ID.unique();
            const newTarget = await users.createTarget(
                userId,
                targetId,
                'push',           // providerType
                token,            // identifier (el token FCM)
                providerId        // providerId (teléfono + PUSH)
            );

            console.log('[RegisterTarget] Target creado exitosamente:', newTarget.$id);

            return NextResponse.json({
                success: true,
                action: 'created',
                targetId: newTarget.$id,
                providerId: newTarget.providerId
            });

        } catch (appwriteError) {
            console.error('[RegisterTarget] Appwrite error:', appwriteError);

            // Si es un error de target duplicado, lo manejamos
            if (appwriteError.code === 409) {
                return NextResponse.json({
                    success: true,
                    action: 'already_exists',
                    message: 'Target ya registrado'
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

        let targetToDelete = targetId;

        // Si no tenemos targetId pero tenemos phone, buscamos el target
        if (!targetToDelete && phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            const providerId = `${cleanPhone}PUSH`;

            const targets = await users.listTargets(userId);
            const pushTarget = targets.targets.find(
                target => target.providerType === 'push' && target.providerId === providerId
            );

            if (pushTarget) {
                targetToDelete = pushTarget.$id;
            }
        }

        if (!targetToDelete) {
            return NextResponse.json(
                { error: 'No se encontró el target a eliminar' },
                { status: 404 }
            );
        }

        await users.deleteTarget(userId, targetToDelete);

        console.log('[RegisterTarget] Target eliminado:', targetToDelete);

        return NextResponse.json({
            success: true,
            action: 'deleted',
            targetId: targetToDelete
        });

    } catch (error) {
        console.error('[RegisterTarget] Error al eliminar:', error);
        return NextResponse.json(
            { error: 'Error al eliminar push target', details: error.message },
            { status: 500 }
        );
    }
}
