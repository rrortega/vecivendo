const { Client, Databases, Query, ID } = require('node-appwrite');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Configuration
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY; // Must be a server-side API key
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = 'contenidos';
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;

if (!PROJECT_ID || !API_KEY || !DATABASE_ID || !ENDPOINT) {
    console.error('Error: Missing environment variables.');
    console.error('Ensure NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY, NEXT_PUBLIC_APPWRITE_DATABASE, and NEXT_PUBLIC_APPWRITE_ENDPOINT are set in .env.local');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function seedArticles() {
    try {
        console.log('Starting help center articles seeding...');

        // 1. Load new articles
        const articlesPath = path.join(__dirname, 'help_articles_data.json');
        const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
        console.log(`Loaded ${articles.length} articles from JSON.`);

        // 2. Delete existing articles
        console.log('Fetching existing articles to delete...');
        let existingDocs = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.limit(100)
        ]);

        // Handle pagination if more than 100 docs exist (loop until empty)
        // For safety, we'll just loop while there are documents.
        let deletedCount = 0;
        while (existingDocs.documents.length > 0) {
            const promises = existingDocs.documents.map(doc =>
                databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id)
            );
            await Promise.all(promises);
            deletedCount += existingDocs.documents.length;
            console.log(`Deleted batch of ${existingDocs.documents.length} articles.`);

            existingDocs = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
                Query.limit(100)
            ]);
        }
        console.log(`Total deleted articles: ${deletedCount}`);

        // 3. Create new articles
        console.log('Creating new articles...');
        let createdCount = 0;
        for (const article of articles) {
            try {
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTION_ID,
                    ID.unique(),
                    {
                        slug: article.slug,
                        titulo: article.titulo,
                        category: article.category,
                        descripcion: article.descripcion,
                        contenido_largo: article.contenido_largo,
                        tipo_contenido: 'help',
                        active: true // Ensure they are active
                    }
                );
                createdCount++;
                // Optional: small delay to avoid rate limits if necessary, 
                // but for 50 items it should be fine.
            } catch (err) {
                console.error(`Failed to create article "${article.titulo}":`, err.message);
            }
        }

        console.log(`Successfully created ${createdCount} new articles.`);
        console.log('Seeding complete!');

    } catch (error) {
        console.error('Seeding failed:', error);
    }
}

seedArticles();
