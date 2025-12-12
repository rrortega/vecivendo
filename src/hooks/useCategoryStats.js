import { useState, useEffect } from "react";
import { Databases, Query } from "appwrite";
import { client } from "@/lib/appwrite";

export const useCategoryStats = (residentialId) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                // 1. Fetch all active categories
                const categoriesResponse = await databases.listDocuments(
                    dbId,
                    "categorias",
                    [
                        Query.equal("activo", true),
                        Query.orderAsc("orden")
                    ]
                );

                // 2. Fetch all active ads for this residential
                // We need to fetch all to count them. Pagination might be an issue if there are thousands,
                // but for now we'll assume a reasonable number or fetch a large limit.
                // We filter by residential, active status, and not expired.

                // Note: We can't easily do "group by" in Appwrite, so we fetch ads and count client-side.
                // Optimally, we would have a separate stats collection or cloud function, but this works for now.

                let activeAds = [];
                if (residentialId) {
                    const now = new Date().toISOString();
                    const adsResponse = await databases.listDocuments(
                        dbId,
                        "anuncios",
                        [
                            Query.equal("residencial", residentialId),
                            Query.equal("activo", true),
                            // Query.greaterThan("fecha_expiracion", now) // Check expiration if field exists
                            // Based on previous tasks, we use updatedAt + dias_vigencia to calculate expiration.
                            // Doing that calculation in query is hard. We might need to fetch and filter.
                            Query.limit(1000) // Fetch up to 1000 ads for counting
                        ]
                    );
                    activeAds = adsResponse.documents;
                }

                // 3. Calculate counts and filter expired ads
                const categoryCounts = {};
                const now = new Date();

                activeAds.forEach(ad => {
                    // Check expiration logic
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

                // 4. Map categories with counts and sort
                const stats = categoriesResponse.documents.map(cat => ({
                    ...cat,
                    count: categoryCounts[cat.slug] || 0
                })).sort((a, b) => b.count - a.count); // Sort by count descending

                // Calculate total count
                const totalCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

                setCategories(stats);

            } catch (error) {
                console.error("Error fetching category stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [residentialId]);

    return { categories, loading, totalCount: categories.reduce((sum, cat) => sum + cat.count, 0) };
};
