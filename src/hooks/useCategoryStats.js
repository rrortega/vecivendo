import { useState, useEffect } from "react";
import { Databases, Query } from "appwrite";
import { client } from "@/lib/appwrite";

export const useCategoryStats = (residentialId) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cacheKey = `categories_cache_${residentialId}`;

        const fetchData = async () => {
            try {
                // 1. Try to load from cache first
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    try {
                        const parsed = JSON.parse(cachedData);
                        // User requested: "without the badget of quantity" for offline/cache
                        // So we ensure counts are 0 or removed when loading from cache initially
                        const cachedWithoutBadge = parsed.map(c => ({ ...c, count: 0 }));
                        setCategories(cachedWithoutBadge);
                        setLoading(false);
                    } catch (e) {
                        console.error("Error parsing category cache:", e);
                    }
                } else {
                    setLoading(true);
                }

                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                // 2. Fetch all active categories
                const categoriesResponse = await databases.listDocuments(
                    dbId,
                    "categorias",
                    [
                        Query.equal("activo", true),
                        Query.orderAsc("orden")
                    ]
                );

                // 3. Fetch all active ads for this residential
                let activeAds = [];
                if (residentialId) {
                    const adsResponse = await databases.listDocuments(
                        dbId,
                        "anuncios",
                        [
                            Query.equal("residencial", residentialId),
                            Query.equal("activo", true),
                            Query.limit(1000) // Fetch up to 1000 ads for counting
                        ]
                    );
                    activeAds = adsResponse.documents;
                }

                // 4. Calculate counts and filter expired ads
                const categoryCounts = {};
                const now = new Date();

                activeAds.forEach(ad => {
                    const updatedAt = new Date(ad.$updatedAt);
                    const daysValid = ad.dias_vigencia || 30;
                    const expirationDate = new Date(updatedAt.getTime() + daysValid * 24 * 60 * 60 * 1000);

                    if (expirationDate > now) {
                        const catSlug = ad.categoria_slug || (ad.categoria ? ad.categoria.toLowerCase() : null);
                        if (catSlug) {
                            categoryCounts[catSlug] = (categoryCounts[catSlug] || 0) + 1;
                        }
                    }
                });

                // 5. Map categories with counts and sort
                const stats = categoriesResponse.documents.map(cat => ({
                    ...cat,
                    count: categoryCounts[cat.slug] || 0
                })).sort((a, b) => b.count - a.count);

                setCategories(stats);

                // Save to cache (we save WITH counts, but stripped on load if needed, 
                // OR we save WITHOUT counts. User said "without badge", implying the cached view.
                // If we save without counts, we lose the info for next load.
                // But the requirement is "on local cache ... without the badget".
                // I'll save IT AS IS, but when I LOAD IT in the `if (cachedData)` block above, I set count: 0.
                localStorage.setItem(cacheKey, JSON.stringify(stats));

            } catch (error) {
                console.error("Error fetching category stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const handleOnline = () => {
            console.log("Online connection restored. Revalidating categories...");
            fetchData();
        };

        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [residentialId]);

    return { categories, loading, totalCount: categories.reduce((sum, cat) => sum + cat.count, 0) };
};
