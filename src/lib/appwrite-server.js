import { Client, Databases, Storage, Users } from 'node-appwrite';

// Cliente de Appwrite configurado para uso en servidor (API routes)
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

export const databases = new Databases(client);
export const storage = new Storage(client);
export const users = new Users(client);

// IDs de base de datos y colecciones
export const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
export const adsCollectionId = 'anuncios';
export const residentialsCollectionId = 'residenciales';
