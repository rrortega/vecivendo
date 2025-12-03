import { NextResponse } from 'next/server';
import { databases, dbId, adsCollectionId } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';

// GET /api/ads - Listar anuncios con filtros y paginación
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Parámetros de paginación
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const offset = (page - 1) * limit;

        // Construir queries
        const queries = [
            Query.limit(limit),
            Query.offset(offset),
            Query.orderDesc('$updatedAt')
        ];

        // Filtros opcionales
        const residencial = searchParams.get('residencial');
        const categoria = searchParams.get('categoria');
        const searchTerm = searchParams.get('search');
        const activo = searchParams.get('activo');

        if (residencial && residencial !== 'todos') {
            queries.push(Query.equal('residencial', residencial));
        }

        if (categoria && categoria !== 'todos') {
            queries.push(Query.equal('categoria', categoria));
        }

        if (searchTerm) {
            queries.push(Query.search('titulo', searchTerm));
        }

        if (activo !== null && activo !== undefined) {
            queries.push(Query.equal('activo', activo === 'true'));
        }

        console.log('📋 [API] Listando anuncios con queries:', queries.length);

        const response = await databases.listDocuments(dbId, adsCollectionId, queries);

        console.log(`✅ [API] Obtenidos ${response.documents.length} anuncios de ${response.total} totales`);

        return NextResponse.json({
            documents: response.documents,
            total: response.total
        });

    } catch (error) {
        console.error('❌ [API] Error listando anuncios:', {
            message: error.message,
            code: error.code,
            type: error.type
        });

        return NextResponse.json(
            { error: error.message || 'Error al obtener anuncios' },
            { status: error.code || 500 }
        );
    }
}

// POST /api/ads - Crear nuevo anuncio
export async function POST(request) {
    try {
        const body = await request.json();

        console.log('📝 [API] Creando anuncio:', {
            titulo: body.titulo,
            precio: body.precio,
            categoria: body.categoria
        });

        // Validaciones básicas
        if (!body.titulo || !body.precio || !body.categoria) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos: titulo, precio, categoria' },
                { status: 400 }
            );
        }

        // Crear documento
        const document = await databases.createDocument(
            dbId,
            adsCollectionId,
            ID.unique(),
            body
        );

        console.log('✅ [API] Anuncio creado exitosamente:', document.$id);

        return NextResponse.json(document, { status: 201 });

    } catch (error) {
        console.error('❌ [API] Error creando anuncio:', {
            message: error.message,
            code: error.code,
            type: error.type
        });

        return NextResponse.json(
            { error: error.message || 'Error al crear anuncio' },
            { status: error.code || 500 }
        );
    }
}
