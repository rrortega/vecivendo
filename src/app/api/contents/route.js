import { NextResponse } from 'next/server';
import { databases } from '@/lib/appwrite-server';
import { cookies } from 'next/headers';
import { Client, Account, ID } from 'node-appwrite';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = 'contenidos';

export async function POST(request) {
    try {
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

        // Create document using server SDK with API key (bypasses permissions)
        const newDoc = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(),
            body
        );

        return NextResponse.json(newDoc);
    } catch (error) {
        console.error('Error creating content:', error);
        return NextResponse.json(
            { error: error.message || 'Error al crear el contenido' },
            { status: error.code || 500 }
        );
    }
}
