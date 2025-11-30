import { Client, Databases, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
import { articles } from './src/data/helpData.js';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = 'contenidos';

async function seedHelpCenter() {
    try {
        console.log('Checking if collection exists...');
        try {
            await databases.getCollection(DATABASE_ID, COLLECTION_ID);
            console.log('Collection already exists.');
        } catch (error) {
            if (error.code === 404) {
                console.log('Creating collection...');
                await databases.createCollection(
                    DATABASE_ID,
                    COLLECTION_ID,
                    'Contenidos de Ayuda',
                    [
                        Permission.read(Role.any()),
                        Permission.write(Role.users()), // Or specific admin role
                    ]
                );

                console.log('Creating attributes...');
                await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'title', 255, true);
                await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'slug', 255, true);
                await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'category', 50, true);
                await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'excerpt', 500, true);
                await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'content', 10000, true); // Large text for markdown
                await databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, 'active', true, false); // Default false? Or true? User said active:boolean.

                console.log('Waiting for attributes to be created...');
                await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for attributes
            } else {
                throw error;
            }
        }

        console.log('Seeding articles...');
        for (const article of articles) {
            try {
                // Check if article with slug exists to avoid duplicates if re-running
                const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
                    // We can't query by slug immediately if index not created, but for seeding we can try-catch or just create
                ]);

                // For simplicity in this seed script, we'll just create. 
                // Ideally we should check for duplicates.
                // Let's assume we want to upsert or just create new ones.
                // Since we don't have an index on slug yet, we can't query efficiently.
                // We'll just create and let it fail if ID conflict (but we use unique ID).
                // Actually, let's use the article.id as the document ID if possible, or just auto-generate.
                // article.id is integer, Appwrite needs string.

                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTION_ID,
                    ID.unique(),
                    {
                        titulo: article.title,
                        slug: article.slug,
                        category: article.category,
                        descripcion: article.excerpt,
                        contenido_largo: article.content,
                        tipo_contenido: 'help',
                        active: true
                    }
                );
                console.log(`Created article: ${article.title}`);
            } catch (err) {
                console.error(`Failed to create article ${article.title}:`, err.message);
            }
        }

        console.log('Seeding complete!');
    } catch (error) {
        console.error('Error seeding help center:', error);
    }
}

seedHelpCenter();
