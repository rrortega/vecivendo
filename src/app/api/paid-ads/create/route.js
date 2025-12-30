import { NextResponse } from 'next/server';
import { tablesDB, dbId } from '@/lib/appwrite-server';
import { ID } from 'node-appwrite';

const PAID_ADS_COLLECTION_ID = 'anuncios_pago';

export async function POST(request) {
    try {
        const body = await request.json();

        // 1. Validation
        if (!body.titulo || !body.fechaInicio || !body.fechaFin) {
            return NextResponse.json(
                { error: "Faltan campos requeridos (titulo, fechas)" },
                { status: 400 }
            );
        }

        // 2. Format Dates to ISO Strings
        // Input: "2024-12-13" -> Output: "2024-12-13T00:00:00.000Z" (or similar)
        // Ensure they are valid dates
        const fechaInicioISO = new Date(body.fechaInicio).toISOString();
        const fechaFinISO = new Date(body.fechaFin).toISOString();

        // 3. Construct Payload mapping to DB Schema (snake_case based on error)
        const payload = {
            titulo: body.titulo,
            descripcion: body.descripcion,
            link: body.link, // Created
            type: body.type,
            image_url: body.imagen, // Mapped from imagen
            active: Boolean(body.active), // Created
            creditos: parseFloat(body.creditos || 0), // Schema says double

            // Fixed attributes from error message
            fecha_inicio: fechaInicioISO,
            fecha_fin: fechaFinISO,

            // Relations / Arrays
            categories: body.categorias || [], // Mapped from categorias
            residenciales: body.residenciales || [], // Created

            // Stats
            vistas: 0,
            clicks: 0,

            // Note: impacto_diario is likely not in schema yet, keeping it out to avoid errors.
            // If needed, we must create it.
        };

        // 4. Create Document
        const result = await tablesDB.createRow({
            databaseId: dbId, tableId: PAID_ADS_COLLECTION_ID, rowId: ID.unique(), data: payload
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        console.error('❌ [API] Error creando anuncio pago:', error);
        return NextResponse.json(
            {
                error: error.message || "Error interno del servidor",
                type: error.type
            },
            { status: 500 }
        );
    }
}
