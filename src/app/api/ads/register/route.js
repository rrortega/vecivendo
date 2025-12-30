import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
const adsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_ADS_COLLECTION || "anuncios";

// API Key validation
const VALID_API_KEY = process.env.ADS_API_KEY;

export const dynamic = 'force-dynamic';

/**
 * POST /api/ads/register
 * Endpoint para registrar anuncios externos con API Key
 * 
 * Headers requeridos:
 * - x-api-key: API Key válida
 * 
 * Body:
 * - titulo: string (requerido)
 * - precio: number (requerido)
 * - celular_anunciante: string (requerido)
 * - descripcion: string
 * - categoria: string
 * - residencial: string (ID del residencial)
 * - imagenes: array de URLs
 * - ... otros campos del anuncio
 */
export async function POST(request) {
    try {
        // 1. Validar API Key
        const apiKey = request.headers.get('x-api-key');

        if (!apiKey || apiKey !== VALID_API_KEY) {
            return NextResponse.json(
                { error: 'API Key inválida o faltante' },
                { status: 401 }
            );
        }

        // 2. Obtener datos del body
        const body = await request.json();
        const { titulo, precio, celular_anunciante, ...otherFields } = body;

        // 3. Validar campos requeridos
        if (!titulo || precio === undefined || !celular_anunciante) {
            return NextResponse.json(
                {
                    error: 'Campos requeridos faltantes',
                    required: ['titulo', 'precio', 'celular_anunciante']
                },
                { status: 400 }
            );
        }

        // 4. Buscar anuncio existente con mismo título, precio y celular
        const existingAds = await databases.listDocuments(
            dbId,
            adsCollectionId,
            [
                Query.equal('titulo', titulo),
                Query.equal('precio', precio),
                Query.equal('celular_anunciante', celular_anunciante),
                Query.limit(1)
            ]
        );

        const now = new Date().toISOString();

        // 5. Si existe, actualizar y extender
        if (existingAds.documents.length > 0) {
            const existingAd = existingAds.documents[0];

            const updatedAd = await databases.updateDocument(
                dbId,
                adsCollectionId,
                existingAd.$id,
                {
                    ...otherFields,
                    titulo,
                    precio,
                    celular_anunciante,
                    last_capture: now,
                    activo: true // Reactivar si estaba inactivo
                }
            );

            return NextResponse.json({
                success: true,
                action: 'updated',
                message: 'Anuncio actualizado y extendido',
                ad: {
                    $id: updatedAd.$id,
                    titulo: updatedAd.titulo,
                    precio: updatedAd.precio,
                    last_capture: updatedAd.last_capture
                }
            }, { status: 200 });
        }

        // 6. Si no existe, crear nuevo
        const newAd = await databases.createDocument(
            dbId,
            adsCollectionId,
            ID.unique(),
            {
                ...otherFields,
                titulo,
                precio,
                celular_anunciante,
                last_capture: now,
                activo: true
            }
        );

        return NextResponse.json({
            success: true,
            action: 'created',
            message: 'Anuncio creado exitosamente',
            ad: {
                $id: newAd.$id,
                titulo: newAd.titulo,
                precio: newAd.precio,
                last_capture: newAd.last_capture
            }
        }, { status: 201 });

    } catch (error) {
        console.error('❌ [API] Error en registro de anuncio:', error);
        return NextResponse.json(
            {
                error: 'Error al procesar el anuncio',
                details: error.message
            },
            { status: 500 }
        );
    }
}
