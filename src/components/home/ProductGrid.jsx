"use client";

import React, { useEffect, useState, useRef } from "react";
import { Heart, ShoppingCart, ImageOff, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useFavorites } from "@/hooks/useFavorites";
import { useBannerAds } from "@/hooks/useBannerAds";
import BannerCarousel from "@/components/ads/BannerCarousel";
import PaidAdCard from "@/components/ads/PaidAdCard";

export const ProductGrid = ({ currency = "MXN", residentialSlug, residentialId: propResidentialId, sortOption = "recent" }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [residentialId, setResidentialId] = useState(propResidentialId);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(24);
    const [totalItems, setTotalItems] = useState(0);
    const [hasMoreItems, setHasMoreItems] = useState(true);
    const observerTarget = useRef(null);
    const productCacheRef = useRef(new Map());
    const fetchingRef = useRef(false); // Prevent duplicate fetches
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Embedded Ads State
    const [embeddedAds, setEmbeddedAds] = useState([]);

    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("search")?.toLowerCase() || "";
    const categoryFilter = searchParams.get("category");
    const viewMode = searchParams.get("view") || "grid";

    const { isFavorite, toggleFavorite } = useFavorites();

    // Use banner ads hook with caching
    const { banners: bannerAds } = useBannerAds({
        category: categoryFilter,
        residentialId: residentialId,
    });

    // Fetch residential ID if not provided
    useEffect(() => {
        if (propResidentialId) {
            setResidentialId(propResidentialId);
            return;
        }

        const fetchResidentialId = async () => {
            if (!residentialSlug) return;
            try {
                const res = await fetch(`/api/residentials/by-slug?slug=${encodeURIComponent(residentialSlug)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.residential?.$id) {
                        setResidentialId(data.residential.$id);
                    }
                }
            } catch (error) {
                console.error("Error fetching residential ID:", error);
            }
        };
        fetchResidentialId();
    }, [residentialSlug, propResidentialId]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
        setHasMoreItems(true);
        fetchingRef.current = false;

        // Hybrid filtering: show cached results immediately
        const cacheKey = `${categoryFilter || 'all'}_${searchQuery || 'none'}_${sortOption}`;
        const cached = productCacheRef.current.get(cacheKey) || [];

        if (cached.length > 0) {
            setProducts(cached);
            setLoading(false);
        } else {
            setProducts([]);
        }
    }, [searchQuery, categoryFilter, sortOption]);

    // Fetch Embedded Ads only (banners are handled by useBannerAds hook)
    useEffect(() => {
        const fetchEmbeddedAds = async () => {
            try {
                const params = new URLSearchParams();
                params.set('type', 'embedded');
                params.set('limit', '20');
                if (categoryFilter) params.set('category', categoryFilter);
                if (residentialId) params.set('residentialId', residentialId);

                const res = await fetch(`/api/paid-ads/public?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    let docs = data.documents || [];

                    // Filter out clicked embedded ads
                    if (typeof window !== 'undefined') {
                        const today = new Date().setHours(0, 0, 0, 0);
                        docs = docs.filter(ad => {
                            const clickedTime = localStorage.getItem(`ad_clicked_${ad.$id}`);
                            if (!clickedTime) return true;
                            const clickedDate = new Date(parseInt(clickedTime)).setHours(0, 0, 0, 0);
                            return clickedDate !== today;
                        });
                    }

                    // Shuffle for random display
                    const shuffled = docs.sort(() => Math.random() - 0.5);
                    setEmbeddedAds(shuffled);
                }
            } catch (error) {
                console.error("Error fetching embedded ads:", error);
            }
        };

        if (residentialId) {
            fetchEmbeddedAds();
        }
    }, [categoryFilter, residentialId]);

    // Load cached products immediately on mount or filter change
    useEffect(() => {
        // Only use cache for initial load or simple filters to avoid complexity
        if (currentPage === 1) {
            const cacheKey = `products_cache_${residentialId}_${categoryFilter || 'all'}_${searchQuery || 'none'}_${sortOption}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    // Check if cache is strictly valid (optional: add timestamp check)
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setProducts(parsed);
                        setLoading(false);
                        // We will still fetch fresh data below, but UI is populated.
                    }
                } catch (e) {
                    console.error("Error parsing product cache: ", e);
                }
            }
        }
    }, [residentialId, categoryFilter, searchQuery, sortOption, currentPage]);

    useEffect(() => {
        if (!residentialId || !hasMoreItems) return;
        if (fetchingRef.current) return; // Prevent duplicate fetches

        const fetchProducts = async () => {
            fetchingRef.current = true;

            if (products.length === 0 && currentPage === 1) {
                // If we didn't have cache processed above, show loading
                // But we might have just mounted and useEffect above ran.
                // Let's rely on 'loading' state being true initially.
                // If cache hit, loading is false, so we don't show skeleton.
                // But we still want to show a small indicator or just replace content silently.
            } else {
                setIsFetching(true);
            }

            try {
                // Build query params for dedicated endpoint
                const params = new URLSearchParams();
                params.set('residentialId', residentialId);
                params.set('sort', sortOption);
                params.set('page', currentPage.toString());
                params.set('limit', itemsPerPage.toString());

                if (categoryFilter) {
                    params.set('category', categoryFilter);
                }

                if (searchQuery) {
                    params.set('search', searchQuery);
                }

                const res = await fetch(`/api/ads/list?${params.toString()}`);

                if (!res.ok) {
                    throw new Error(`Fetch failed: ${res.status}`);
                }

                const response = await res.json();
                const newDocs = response.documents || [];
                const total = response.total || 0;
                const hasMore = response.hasMore ?? true;

                // Check if we've reached the end
                const fetchedSoFar = (currentPage - 1) * itemsPerPage + newDocs.length;
                if (newDocs.length < itemsPerPage || fetchedSoFar >= total) {
                    setHasMoreItems(false);
                }

                // Update cache logic
                let updatedProducts;
                if (currentPage === 1) {
                    updatedProducts = newDocs;

                    // Save to local storage for offline use
                    const cacheKey = `products_cache_${residentialId}_${categoryFilter || 'all'}_${searchQuery || 'none'}_${sortOption}`;
                    localStorage.setItem(cacheKey, JSON.stringify(newDocs));
                } else {
                    setProducts(prev => {
                        const prevIds = new Set(prev.map(p => p.$id));
                        const deduped = newDocs.filter(p => !prevIds.has(p.$id));
                        return [...prev, ...deduped];
                    });
                }

                // Update displayed products (for page 1)
                if (currentPage === 1) {
                    setProducts(newDocs);
                }

                setTotalItems(total);
            } catch (error) {
                console.error("Error fetching products:", error);
                setHasMoreItems(false); // Stop trying on error
            } finally {
                setLoading(false);
                setIsFetching(false);
                fetchingRef.current = false;
            }
        };

        fetchProducts();
    }, [residentialId, sortOption, currentPage, categoryFilter, searchQuery, hasMoreItems, refreshTrigger]);

    // Revalidate on online
    useEffect(() => {
        const handleOnline = () => {
            console.log("Online connection restored. Refreshing products...");
            // Simple way to trigger refetch: clear list and reset page to 1, effectively a hard refresh
            // Or better: ensure we fetch page 1 again.
            // Given the structure, if we reset currentPage to 1, it might trigger the effect.
            // But if it's already 1, it won't.
            // Let's force a reload by clearing products and resetting page.
            productCacheRef.current.clear(); // Clear cache to ensure fresh data
            setProducts([]);
            setHasMoreItems(true);
            setCurrentPage(1);
            setTotalItems(0);
            fetchingRef.current = false;
            // The main useEffect depends on currentPage, so setting it to 1 (even if it was 1) 
            // might not trigger if value is same. But clearing query params or toggling a boolean would.
            // If we empty products, the effect "if (products.length === 0)" condition might help, 
            // but `currentPage` dependency is key.

            // Trick: If `currentPage` is 1, `setCurrentPage(1)` does nothing.
            // But if we have a separate "version" or "refreshKey" state in dependency, it runs.
            // Let's rely on the fact that `products.length` change (to 0) isn't in dependency.
            // But `fetchProducts` is called inside `useEffect`.

            // Safer approach: define a refresh trigger.
            setRefreshTrigger(prev => prev + 1);
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        // Don't observe if loading, fetching, or no more items
        if (loading || isFetching || !hasMoreItems) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMoreItems && !fetchingRef.current) {
                    setCurrentPage(prev => prev + 1);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        const target = observerTarget.current;
        if (target) {
            observer.observe(target);
        }

        return () => {
            if (target) {
                observer.unobserve(target);
            }
        };
    }, [loading, isFetching, hasMoreItems]);

    // ... (filtering and sorting logic) ...
    const filteredProducts = products
        .filter(product => {
            const matchesSearch = !searchQuery ||
                product.titulo?.toLowerCase().includes(searchQuery) ||
                product.descripcion?.toLowerCase().includes(searchQuery);

            const matchesCategory = !categoryFilter || product.categoria_slug === categoryFilter.toLowerCase();

            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortOption === "price_asc") {
                return a.precio - b.precio;
            } else if (sortOption === "price_desc") {
                return b.precio - a.precio;
            } else {
                return new Date(b.$updatedAt) - new Date(a.$updatedAt);
            }
        });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };



    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-20">
                {[...Array(itemsPerPage)].map((_, i) => (
                    <div key={i} className="bg-surface rounded-xl h-64 animate-pulse border border-border" />
                ))}
            </div>
        );
    }

    if (filteredProducts.length === 0 && !loading && totalItems === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 text-text-secondary">
                    <Search size={32} />
                </div>
                <h3 className="text-lg font-bold text-text-main mb-2">No se encontraron productos</h3>
                <p className="text-text-secondary max-w-xs mx-auto">
                    Intenta ajustar tu búsqueda o filtros para encontrar lo que necesitas.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-32 relative">
            {isFetching && (
                <div className="absolute top-0 right-4 z-10">
                    <div className="bg-surface/80 backdrop-blur-sm p-2 rounded-full shadow-sm border border-border">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                </div>
            )}

            {/* Top Banner Carousel - Only first 5 */}
            {bannerAds.length > 0 && (
                <BannerCarousel
                    banners={bannerAds.slice(0, 5)}
                    residentialSlug={residentialSlug}
                />
            )}

            <div className={viewMode === "grid"
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4"
                : "flex flex-col gap-4 px-4 w-full"
            }>
                {filteredProducts.map((product, index) => {
                    // Logic for Embedded Ads:
                    // Insert at pos 6, 12, 18... (1-based index) -> after index 5, 11, 17...
                    // Do not repeat ads. Stop if we run out.
                    // Filter out clicked ads (logic handles this via state, but we ensure here too)

                    const shouldInsertEmbeddedAd = (index + 1) % 6 === 0;
                    let embeddedAd = null;

                    if (shouldInsertEmbeddedAd && embeddedAds.length > 0) {
                        const embeddedAdIndex = Math.floor(index / 6);
                        // Only show if we have enough unique ads
                        if (embeddedAdIndex < embeddedAds.length) {
                            embeddedAd = embeddedAds[embeddedAdIndex];
                        }
                    }

                    // Logic for Banner Ads (Secondary Carousels):
                    // "Si hay mas de 5 banner publicitarios hay que poner un segundo caroucel a los 16 elementos siguientes..."
                    // "si hay mas de 10 banner repetimos el proceso cada 16 elementos"
                    // Interpretation:
                    // - Top carousel: Banners 0-4 (Already handled above outside this loop)
                    // - After product 16: Banners 5-9
                    // - After product 32: Banners 10-14
                    // - etc.

                    const shouldInsertBanner = (index + 1) % 16 === 0;
                    let bannersForCarousel = null;

                    if (shouldInsertBanner && bannerAds.length > 5) {
                        const carouselGroupIndex = ((index + 1) / 16); // 1, 2, 3...
                        const startIndex = carouselGroupIndex * 5;
                        const endIndex = startIndex + 5;

                        // Check if we have banners for this slot
                        if (startIndex < bannerAds.length) {
                            bannersForCarousel = bannerAds.slice(startIndex, endIndex);
                        }
                    }


                    let adLink = `/${residentialSlug}/anuncio/${product.$id}`;
                    if (product.variants && product.variants.length > 0) {
                        try {
                            const safeAtob = (str) => {
                                try { return decodeURIComponent(escape(atob(str))); }
                                catch (e) { return atob(str); }
                            };
                            const generateSlug = (text) => text.toString().toLowerCase()
                                .replace(/\s+/g, '-')
                                .replace(/[^\w\-]+/g, '')
                                .replace(/\-\-+/g, '-')
                                .replace(/^-+/, '')
                                .replace(/-+$/, '');

                            const firstVariantStr = product.variants[0];
                            const parsed = JSON.parse(safeAtob(firstVariantStr));
                            const type = parsed.type || parsed.name;
                            if (type) {
                                const slug = generateSlug(type);
                                adLink = `/${residentialSlug}/anuncio/${product.$id}/${slug}`;
                            }
                        } catch (e) {
                            console.error("Error parsing variant for link:", e);
                        }
                    }

                    return (
                        <React.Fragment key={product.$id}>
                            <Link
                                href={adLink}
                                className={`group bg-surface rounded-xl overflow-hidden border border-gray-500/30   shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative ${viewMode === "list" ? "flex flex-row h-40 md:h-48" : "aspect-[3/4]"
                                    }`}
                            >
                                <div className={`${viewMode === "list" ? "w-40 md:w-56 shrink-0 relative" : "absolute inset-0 z-0"} overflow-hidden bg-gray-100 dark:bg-white/5`}>
                                    {(() => {
                                        const images = product.imagenes || [];
                                        const firstImage = Array.isArray(images) ? images[0] : null;
                                        return firstImage ? (
                                            <img
                                                src={firstImage}
                                                alt={product.titulo}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 block"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-text-secondary">
                                                <ImageOff size={24} className="opacity-50" />
                                            </div>
                                        );
                                    })()}
                                    <button
                                        onClick={(e) => toggleFavorite(e, product.$id)}
                                        className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all shadow-sm duration-200 z-20 ${isFavorite(product.$id)
                                            ? "bg-white text-red-500 opacity-100 scale-110"
                                            : "bg-white/80 text-gray-600 hover:text-red-500 border border-transparent hover:border-red-500 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                            }`}
                                    >
                                        <Heart size={18} fill={isFavorite(product.$id) ? "currentColor" : "none"} />
                                    </button>
                                </div>

                                {/* Category Badge - Changed to Top Left */}
                                {product.categoria && viewMode === "grid" && (
                                    <div className="absolute top-2 left-2 z-20">
                                        <span className="inline-block px-2 py-1 text-[10px] font-medium bg-surface/50 backdrop-blur-md text-text-main rounded-md shadow-sm border border-border/20">
                                            {product.categoria}
                                        </span>
                                    </div>
                                )}

                                <div className={`
                                        ${viewMode === "list"
                                        ? "p-4 flex flex-col flex-1 justify-between relative"
                                        : "absolute bottom-0 left-0 right-0 z-10 p-4 pt-24 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-zinc-950 dark:via-zinc-950/50  dark:to-transparent"
                                    }
                                    `}>
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className={`font-medium leading-tight transition-colors ${viewMode === "list"
                                            ? "text-lg line-clamp-2 text-text-main group-hover:text-primary"
                                            : "text-base line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-primary dark:group-hover:text-primary-300 shadow-sm"
                                            }`}>
                                            {product.titulo}
                                        </h3>
                                    </div>

                                    {/* Category in list view only (handled above for grid) */}
                                    {product.categoria && viewMode === "list" && (
                                        <p className="text-xs mb-1 text-text-secondary">
                                            {product.categoria}
                                        </p>
                                    )}

                                    {viewMode === "list" && (
                                        <p className="text-sm text-text-secondary line-clamp-2 mb-2 hidden md:block">
                                            {product.descripcion}
                                        </p>
                                    )}
                                    <div className="flex items-end justify-between mt-1">
                                        <div className="flex flex-col">
                                            {viewMode === 'list' && (<span className={`text-xs mb-0.5 ${viewMode === 'list' ? 'text-text-secondary' : 'text-gray-600 dark:text-gray-400'}`}>Precio</span>)}
                                            <span className={`text-lg font-bold text-primary`}>
                                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 mr-1">
                                                    {product.variants?.length > 1 ? "desde" : "por"}
                                                </span>
                                                {formatPrice(product.precio)}
                                            </span>
                                        </div>
                                        {viewMode === "list" && (
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary hover:text-primary -mr-2">
                                                <ShoppingCart size={18} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Link>

                            {/* Insert Embedded Ad (Non-repeating) */}
                            {embeddedAd && (
                                <PaidAdCard
                                    ad={embeddedAd}
                                    residentialSlug={residentialSlug}
                                    viewMode={viewMode}
                                    currency={currency}
                                />
                            )}

                            {/* Insert Banner Ad Carousel (Batches of 5, every 16 items) */}
                            {bannersForCarousel && bannersForCarousel.length > 0 && (
                                <div className={viewMode === "grid" ? "col-span-full" : "w-full"}>
                                    <BannerCarousel
                                        banners={bannersForCarousel}
                                        residentialSlug={residentialSlug}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Infinite Scroll Loader */}
            {hasMoreItems && (
                <div ref={observerTarget} className="flex justify-center py-8 w-full">
                    {isFetching && <Loader2 className="w-8 h-8 animate-spin text-primary" />}
                </div>
            )}
        </div>
    );
};
