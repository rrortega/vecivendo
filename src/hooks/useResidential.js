import { useState, useEffect } from "react";


export const useResidential = (slug) => {
    const [residential, setResidential] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            return;
        }

        const fetchResidential = async () => {
            // 1. Try to load from cache first
            const cacheKey = `residential_details_${slug}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    setResidential(parsed);
                    setLoading(false); // Show content immediately
                    // We can still continue to fetch fresh data in background if needed, 
                    // or trust the cache if it's recent. For now, let's revalidate in background.
                } catch (e) {
                    console.error("Error parsing cached residential:", e);
                }
            }

            try {
                // Only set loading true if we didn't have cache
                if (!cachedData) setLoading(true);

                const response = await fetch(`/api/residentials?slug=${slug}`);

                if (!response.ok) {
                    if (response.status === 404) throw new Error("Residential not found");
                    throw new Error("Failed to fetch residential");
                }

                const newData = await response.json();

                if (newData) {
                    setResidential(newData);
                    localStorage.setItem(cacheKey, JSON.stringify(newData));
                } else {
                    if (!cachedData) setError("Residential not found");
                }
            } catch (err) {
                console.error("Error fetching residential:", err);
                if (!cachedData) setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchResidential();

        const handleOnline = () => {
            console.log("Online connection restored. Revalidating residential data...");
            fetchResidential();
        };

        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [slug]);

    return { residential, loading, error };
};
