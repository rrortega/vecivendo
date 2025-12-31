import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Endpoint para obtener la clave VAPID pública
export async function GET() {
    try {
        // La clave VAPID pública se configura en las variables de entorno
        // Esta clave se genera en Appwrite Console > Settings > Push Notifications
        const publicKey = process.env.VAPID_PUBLIC_KEY;

        if (!publicKey) {
            return NextResponse.json(
                { error: 'VAPID public key not configured' },
                { status: 500 }
            );
        }

        return NextResponse.json({ publicKey });

    } catch (error) {
        console.error('Error getting VAPID key:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
