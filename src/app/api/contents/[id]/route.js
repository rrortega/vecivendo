import { NextResponse } from 'next/server';
import { tablesDB } from '@/lib/appwrite-server';
import { cookies } from 'next/headers';
import { Client, Account } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = 'contenidos';

export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();

        // Get session from cookies or Authorization header
        const cookieStore = cookies();
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
        const allCookies = cookieStore.getAll();
        const sessionCookie = allCookies.find(c =>
            c.name === `a_session_${projectId}` ||
            c.name === `a_session_${projectId}_legacy` ||
            c.name === 'session'
        );

        let sessionToken = sessionCookie?.value;
        let isJWT = false;

        // Fallback to Authorization header (JWT)
        const authHeader = request.headers.get('Authorization');
        if (!sessionToken && authHeader && authHeader.startsWith('Bearer ')) {
            sessionToken = authHeader.split(' ')[1];
            isJWT = true;
        }

        if (!sessionToken) {
            return NextResponse.json(
                { error: 'No autenticado. Sesión no encontrada.' },
                { status: 401 }
            );
        }

        // Create client to verify admin
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

        // Crucial: Use correct method depending on token type
        if (isJWT) {
            client.setJWT(sessionToken);
        } else {
            client.setSession(sessionToken);
        }

        const account = new Account(client);

        // Get current user
        const user = await account.get();

        // Check if user has admin label
        const isAdmin = user.labels && user.labels.includes('admin');

        if (!isAdmin) {
            return NextResponse.json(
                { error: 'No autorizado. Se requiere permisos de administrador.' },
                { status: 403 }
            );
        }

        // Update document using server SDK with API key (bypasses permissions)
        const updatedDoc = await tablesDB.updateRow({
            databaseId: DATABASE_ID, tableId: COLLECTION_ID, rowId: id, data: body
        });

        return NextResponse.json(updatedDoc);
    } catch (error) {
        console.error('Error updating content:', error);
        return NextResponse.json(
            { error: error.message || 'Error al actualizar el contenido' },
            { status: error.code || 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        // Get session from cookies or Authorization header
        const cookieStore = cookies();
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
        const allCookies = cookieStore.getAll();
        const sessionCookie = allCookies.find(c =>
            c.name === `a_session_${projectId}` ||
            c.name === `a_session_${projectId}_legacy` ||
            c.name === 'session'
        );

        let sessionToken = sessionCookie?.value;
        let isJWT = false;

        // Fallback to Authorization header (JWT)
        const authHeader = request.headers.get('Authorization');
        if (!sessionToken && authHeader && authHeader.startsWith('Bearer ')) {
            sessionToken = authHeader.split(' ')[1];
            isJWT = true;
        }

        if (!sessionToken) {
            return NextResponse.json(
                { error: 'No autenticado. Sesión no encontrada.' },
                { status: 401 }
            );
        }

        // Create client to verify admin
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

        // Crucial: Use correct method depending on token type
        if (isJWT) {
            client.setJWT(sessionToken);
        } else {
            client.setSession(sessionToken);
        }

        const account = new Account(client);

        // Get current user
        const user = await account.get();

        // Check if user has admin label
        const isAdmin = user.labels && user.labels.includes('admin');

        if (!isAdmin) {
            return NextResponse.json(
                { error: 'No autorizado. Se requiere permisos de administrador.' },
                { status: 403 }
            );
        }

        // Delete document using server SDK with API key (bypasses permissions)
        await tablesDB.deleteRow({
            databaseId: DATABASE_ID, tableId: COLLECTION_ID, rowId: id
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting content:', error);
        return NextResponse.json(
            { error: error.message || 'Error al eliminar el contenido' },
            { status: error.code || 500 }
        );
    }
}
