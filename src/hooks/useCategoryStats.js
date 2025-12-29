import { useState, useEffect } from "react";
import baas from "@/lib/baas";

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

                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                // 2. Fetch all active categories
                // 2. Fetch all active categories
                const response = await fetch('/api/categories');
                if (!response.ok) throw new Error("Failed to fetch categories");
                const categoriesResponse = await response.json();

                // 3. Fetch all active ads for this residential
                let activeAds = [];
                if (residentialId) {
                    if (residentialId) {
                        const params = new URLSearchParams({
                            residential: residentialId,
                            active: 'true',
                            limit: '1000'
                        });

                        const adsResponse = await fetch(`/api/ads?${params}`);
                        if (!adsResponse.ok) throw new Error("Failed to fetch ads");
                        const adsData = await adsResponse.json();
                        activeAds = adsData.documents;
                    }
                }

                // 4. Calculate counts and filter expired ads
                const categoryCounts = {};
                const now = new Date();

                activeAds.forEach(ad => {
                    let catSlug = ad.categoria_slug;

                    // If no slug on ad, try to match by name from fetched categories
                    if (!catSlug && ad.categoria) {
                        const normalizedAdCat = ad.categoria.toLowerCase().trim();
                        const match = categoriesResponse.documents.find(c =>
                            c.nombre.toLowerCase() === normalizedAdCat ||
                            c.slug === normalizedAdCat
                        );
                        if (match) {
                            catSlug = match.slug;
                        } else {
                            // Fallback: basic normalization
                            catSlug = normalizedAdCat.replace(/\s+/g, '-');
                        }
                    }

                    if (catSlug) {
                        // Normalize to lowercase for consistency
                        catSlug = catSlug.toLowerCase();
                        categoryCounts[catSlug] = (categoryCounts[catSlug] || 0) + 1;
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
