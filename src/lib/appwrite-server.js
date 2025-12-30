import { Client, Databases, TablesDB, Storage, Users } from 'node-appwrite';

// Cliente de Appwrite configurado para uso en servidor (API routes)
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

// Deprecated: usar tablesDB en su lugar
export const databases = new Databases(client);

// Nueva API recomendada (Appwrite 1.8.0+)
export const tablesDB = new TablesDB(client);

export const storage = new Storage(client);
export const users = new Users(client);

// IDs de base de datos y colecciones/tablas
export const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
export const adsCollectionId = 'anuncios';
export const adsTableId = 'anuncios'; // Alias para TablesDB
export const residentialsCollectionId = 'residenciales';
export const residentialsTableId = 'residenciales'; // Alias para TablesDB
