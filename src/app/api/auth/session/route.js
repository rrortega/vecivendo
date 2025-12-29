import { NextResponse } from 'next/server';
import { users } from '@/lib/appwrite-server';

/**
 * POST /api/auth/session
 * Genera un nuevo token de sesión para un usuario verificado
 */
export async function POST(request) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { error: 'Teléfono requerido' },
                { status: 400 }
            );
        }

        // Normalizar el teléfono para el userId de Appwrite
        let userId = phone.replace(/\+/g, '').replace(/\D/g, '');

        // Asegurar formato 521XXXXXXXXXX para México
        if (userId.startsWith('52') && userId.length === 12 && !userId.startsWith('521')) {
            userId = '521' + userId.substring(2);
        }

        console.log(`🔐 [API] Generando token de sesión para: ${userId}`);

        // Generar un nuevo token
        const token = await users.createToken(userId);

        return NextResponse.json({
            userId: userId,
            secret: token.secret
        });

    } catch (error) {
        console.error('❌ [API] Error generando token de sesión:', error);
        return NextResponse.json(
            { error: error.message || 'Error al generar token de sesión' },
            { status: error.code || 500 }
        );
    }
}
