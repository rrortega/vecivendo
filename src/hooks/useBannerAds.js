"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Cache storage for banners
const bannerCache = {
    data: null,
    timestamp: 0,
    category: null,
    residentialId: null,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * useBannerAds - Hook to fetch and cache banner ads
 * 
 * Features:
 * - Caches banners to avoid re-fetching on filter/navigation changes
 * - Only re-fetches when category or residential changes
 * - Returns stable reference to prevent unnecessary re-renders
 * 
 * @param {Object} options
 * @param {string} options.category - Category slug to filter by
 * @param {string} options.residentialId - Residential ID to filter by
 */
export function useBannerAds({ category = null, residentialId = null } = {}) {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchingRef = useRef(false);

    const fetchBanners = useCallback(async (forceRefresh = false) => {
        // Check if we need to fetch
        const cacheKey = `${category || 'all'}_${residentialId || 'all'}`;
        const cachedKey = `${bannerCache.category || 'all'}_${bannerCache.residentialId || 'all'}`;
        const cacheAge = Date.now() - bannerCache.timestamp;

        // Use cache if valid and same filters
        if (
            !forceRefresh &&
            bannerCache.data &&
            cacheKey === cachedKey &&
            cacheAge < CACHE_TTL
        ) {
            setBanners(bannerCache.data);
            setLoading(false);
            return;
        }

        // Prevent duplicate fetches
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.set('type', 'banner');
            params.set('limit', '20');

            if (category) {
                params.set('category', category);
            }

            if (residentialId) {
                params.set('residentialId', residentialId);
            }

            const response = await fetch(`/api/paid-ads/public?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch banners: ${response.status}`);
            }

            const data = await response.json();
            const fetchedBanners = data.documents || [];

            // Update cache
            bannerCache.data = fetchedBanners;
            bannerCache.timestamp = Date.now();
            bannerCache.category = category;
            bannerCache.residentialId = residentialId;

            // Filter out clicked banners
            let displayBanners = fetchedBanners;
            if (typeof window !== 'undefined') {
                const today = new Date().setHours(0, 0, 0, 0);
                displayBanners = fetchedBanners.filter(ad => {
                    const clickedTime = localStorage.getItem(`ad_clicked_${ad.$id}`);
                    if (!clickedTime) return true;

                    const clickedDate = new Date(parseInt(clickedTime)).setHours(0, 0, 0, 0);
                    return clickedDate !== today;
                });
            }

            setBanners(displayBanners);
        } catch (err) {
            console.error('Error fetching banner ads:', err);
            setError(err.message);

            // Use stale cache if available
            if (bannerCache.data) {
                // Also filter stale cache
                let displayBanners = bannerCache.data;
                if (typeof window !== 'undefined') {
                    const today = new Date().setHours(0, 0, 0, 0);
                    displayBanners = bannerCache.data.filter(ad => {
                        const clickedTime = localStorage.getItem(`ad_clicked_${ad.$id}`);
                        if (!clickedTime) return true;
                        const clickedDate = new Date(parseInt(clickedTime)).setHours(0, 0, 0, 0);
                        return clickedDate !== today;
                    });
                }
                setBanners(displayBanners);
            }
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [category, residentialId]);

    // Initial fetch
    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    // Expose refresh function
    const refresh = useCallback(() => {
        fetchBanners(true);
    }, [fetchBanners]);

    return {
        banners,
        loading,
        error,
        refresh,
    };
}

/**
 * Clear the banner cache (useful when ads are updated)
 */
export function clearBannerCache() {
    bannerCache.data = null;
    bannerCache.timestamp = 0;
    bannerCache.category = null;
    bannerCache.residentialId = null;
}

export default useBannerAds;
