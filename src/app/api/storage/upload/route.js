import { NextResponse } from 'next/server';
import { storage } from '@/lib/appwrite-server';
import { ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

const BUCKET_ID = 'adv-images';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
// We can use a simpler hardcoded base URL or derive it.
// The user required: https://chambapro-appwrite.s3.us-east-1.amazonaws.com/storage/uploads/app-[ID]/adv-images/[FILE_ID].[EXT]
const S3_BASE_URL = "https://chambapro-appwrite.s3.us-east-1.amazonaws.com/storage/uploads";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { error: 'No se encontró el archivo' },
                { status: 400 }
            );
        }

        // Validate basic file type if needed, but client does it too.
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'El archivo debe ser una imagen' },
                { status: 400 }
            );
        }

        // Upload to Appwrite Storage using server SDK
        // storage.createFile expects: bucketId, fileId, file
        // For node-appwrite, 'file' input is InputFile from 'node-appwrite'. 
        // But request.formData() returns a standard File object.
        // node-appwrite's ID.unique() is needed.

        // IMPORTANT: node-appwrite might handle standard File objects in newer versions, 
        // or we typically pass a Buffer or stream. 
        // However, with Next.js App Router, formData.get('file') is a standard File/Blob.
        // Let's rely on node-appwrite to handle this or convert if necessary.
        // Usually `InputFile.fromBuffer(buffer, filename)` or stream is used if File isn't supported directly.
        // Let's try passing the file directly first as modern SDKs often support it, 
        // but to be safe and standard with server-side:

        // We need to convert the File to something node-appwrite accepts.
        // ID.unique()

        // Wait, node-appwrite InputFile:
        // InputFile.fromBuffer(buffer, filename);
        // InputFile.fromPath(path, filename);
        // InputFile.fromStream(stream, filename, size);

        // Converting Next.js File to Buffer:
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('📦 [API] Subiendo archivo:', {
            name: file.name,
            size: buffer.length,
            type: file.type
        });



        // Use InputFile.fromBuffer
        const inputFile = InputFile.fromBuffer(buffer, file.name);

        const response = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            inputFile
        );

        // Construct S3 URL
        // Construct S3 URL
        const fileExt = file.name.split('.').pop().toLowerCase();
        // Use response.$id to ensure we use the actual stored ID
        const s3Url = `${S3_BASE_URL}/app-${PROJECT_ID}/adv-images/${response.$id}.${fileExt}`;

        // Auto-save logic if adId is provided
        const adId = formData.get('adId');
        if (adId) {
            try {
                const { databases, dbId, adsCollectionId } = await import('@/lib/appwrite-server');
                const ad = await databases.getDocument(dbId, adsCollectionId, adId);
                const currentImages = ad.imagenes || [];

                await databases.updateDocument(dbId, adsCollectionId, adId, {
                    imagenes: [...currentImages, s3Url]
                });
                console.log('✅ [API] Imagen añadida al anuncio:', adId);
            } catch (dbError) {
                console.error('⚠️ [API] Error actualizando documento del anuncio:', dbError);
                // We don't fail the request, just log it. The client still gets the URL.
            }
        }

        return NextResponse.json({
            id: response.$id,
            name: response.name,
            url: s3Url
        });

    } catch (error) {
        console.error('❌ [API] Error subiendo imagen:', error);
        return NextResponse.json(
            { error: error.message || 'Error al subir la imagen' },
            { status: 500 }
        );
    }
}
