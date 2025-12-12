
const { Client, Databases, Query } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://aw.chamba.pro/v1')
    .setProject('692786a2002bfd4c58a6')
    .setKey(process.env.APPWRITE_API_KEY); // Need API key for write operations

const databases = new Databases(client);
const dbId = "vecivendo-db";
const adsCollectionId = "anuncios";
const categoriesCollectionId = "categorias";

async function migrate() {
    try {
        console.log("Fetching categories...");
        const categoriesResponse = await databases.listDocuments(
            dbId,
            categoriesCollectionId,
            [Query.limit(100)]
        );

        const categoryMap = {}; // Name -> Slug
        categoriesResponse.documents.forEach(cat => {
            categoryMap[cat.nombre] = cat.slug;
            // Also handle lowercase name just in case
            categoryMap[cat.nombre.toLowerCase()] = cat.slug;
        });

        // Manual mappings for known rogues
        categoryMap['Alimentos'] = 'comida';
        categoryMap['Joyería'] = 'ropa-calzado'; // Best fit or 'otros'

        console.log("Category Map built:", categoryMap);

        console.log("Fetching ads...");
        let allAds = [];
        let cursor = null;

        while (true) {
            const queries = [Query.limit(100)];
            if (cursor) {
                queries.push(Query.cursorAfter(cursor));
            }

            const response = await databases.listDocuments(dbId, adsCollectionId, queries);
            allAds = allAds.concat(response.documents);

            if (response.documents.length < 100) break;
            cursor = response.documents[response.documents.length - 1].$id;
        }

        console.log(`Found ${allAds.length} ads to check.`);

        let updatedCount = 0;
        for (const ad of allAds) {
            const currentCategory = ad.categoria;
            // Normalize current category to find match
            // Some might assume 'categoria' holds the Name, but in AdEditForm it seemed to save the slug or name?
            // Let's check the map.

            // If ad.categoria is already a slug in our values, we might just want to set categoria_slug = categoria.
            let targetSlug = categoryMap[currentCategory] || categoryMap[currentCategory?.trim()] || categoryMap[currentCategory?.trim().toLowerCase()];

            // If not found in map, maybe the 'categoria' field ALREADY contains the slug?
            // Let's check if 'currentCategory' exists as a slug value in our map.
            if (!targetSlug) {
                const isSlug = Object.values(categoryMap).includes(currentCategory);
                if (isSlug) {
                    targetSlug = currentCategory;
                }
            }

            if (targetSlug && ad.categoria_slug !== targetSlug) {
                console.log(`Updating Ad ${ad.$id}: '${currentCategory}' -> '${targetSlug}'`);
                await databases.updateDocument(
                    dbId,
                    adsCollectionId,
                    ad.$id,
                    {
                        categoria_slug: targetSlug
                    }
                );
                updatedCount++;
            } else if (!targetSlug) {
                console.warn(`Could not find slug for category: '${currentCategory}' in Ad ${ad.$id}`);
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} ads.`);

    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrate();
