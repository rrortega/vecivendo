import { NextResponse } from 'next/server';
import { storage } from '@/lib/appwrite-server';

const BUCKET_ID = 'adv-images';

export async function POST(request) {
    try {
        const body = await request.json();
        const { fileId } = body;

        if (!fileId) {
            return NextResponse.json(
                { error: 'Se requiere fileId' },
                { status: 400 }
            );
        }

        // Delete from Appwrite Storage using server SDK
        await storage.deleteFile(
            BUCKET_ID,
            fileId
        );

        return NextResponse.json({
            success: true
        });

    } catch (error) {
        console.error('❌ [API] Error eliminando imagen:', error);
        return NextResponse.json(
            { error: error.message || 'Error al eliminar la imagen' },
            { status: 500 }
        );
    }
}
