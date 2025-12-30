import { NextResponse } from 'next/server';
import { tablesDB } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
const COLLECTION_ID = 'anuncios';

function getPhoneVariations(phone) {
    // Limpiar el número
    const cleanPhone = phone.replace(/\D/g, '');
    const variations = new Set();

    // Agregar el número original
    variations.add(phone);
    variations.add(cleanPhone);

    // Si empieza con 52 o +52, generar variaciones
    if (phone.startsWith('+52') || phone.startsWith('52')) {
        const withoutPrefix = cleanPhone.replace(/^52/, '');

        // Variaciones con 52
        variations.add(`52${withoutPrefix}`);
        variations.add(`+52${withoutPrefix}`);

        // Variaciones con 521
        variations.add(`521${withoutPrefix}`);
        variations.add(`+521${withoutPrefix}`);
    }

    return Array.from(variations);
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');
        const residentialSlug = searchParams.get('residential');

        // Validación de parámetros
        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        if (!residentialSlug) {
            return NextResponse.json(
                { error: 'Residential slug is required' },
                { status: 400 }
            );
        }

        // Generar variaciones del número
        const phoneVariations = getPhoneVariations(phone);

        // Consultar anuncios con cualquiera de las variaciones
        // Query.equal acepta un array de valores para buscar con OR
        const response = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: COLLECTION_ID,
            queries: [
                Query.equal('celular_anunciante', phoneVariations),
                Query.orderDesc('$updatedAt'),
                Query.limit(100)
            ]
        });

        return NextResponse.json({
            documents: response.rows,
            total: response.total
        });

    } catch (error) {
        console.error('Error fetching user ads:', error);
        console.error('Error details:', error.message);
        return NextResponse.json(
            { error: 'Error fetching ads', details: error.message },
            { status: 500 }
        );
    }
}
