"use client";

import { useState, useEffect, useRef } from 'react';
import baas from "@/lib/baas";
import { HomeHeader } from "@/components/home/HomeHeader";
import { CommunityAlertBar } from "@/components/layout/CommunityAlertBar";
import { Button } from "@/components/ui/Button";
import { Loader2, AlertCircle, ArrowLeft, MessageCircle, Share2, ShoppingCart, Plus, Minus, User as UserIcon, Package, Heart, Home, Star, Gift, Eye, EyeOff, X, ChevronLeft, ChevronRight, Pencil, BarChart3 } from "lucide-react";
import AdAnalytics from "@/components/console/ads/AdAnalytics";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ShareModal } from "@/components/ui/ShareModal";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useFavorites } from "@/hooks/useFavorites";
import { useResidential } from "@/hooks/useResidential";
import { Clock } from "lucide-react";
import { AdDetailSkeleton } from "@/components/skeletons/AdDetailSkeleton";
import PaidAdCard from "@/components/ads/PaidAdCard";

export default function AdDetailPage({ params, initialAd }) {
    const { residencial: residencialSlug, id: adId, variant_slug } = params;
    const router = useRouter();

    const [loading, setLoading] = useState(!initialAd);
    const [error, setError] = useState(null);
    const [ad, setAd] = useState(initialAd || null);
    const [relatedAds, setRelatedAds] = useState([]); // This now holds mixed types
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
    const [advertiserInfo, setAdvertiserInfo] = useState(null);
    // crossPromoAd state removed

    // Variant state
    const [variants, setVariants] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [showOriginals, setShowOriginals] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    // New state for image loading indicator
    const [isMainImageLoading, setIsMainImageLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [showMetricsModal, setShowMetricsModal] = useState(false);
    const [isNavigatingToEdit, setIsNavigatingToEdit] = useState(false);
    const variantRefs = useRef([]);

    // Scroll to selected variant on mobile
    useEffect(() => {
        setMounted(true);
        if (selectedVariant && variants.length > 0) {
            const index = variants.findIndex(v => v.slug === selectedVariant.slug);
            if (index !== -1 && variantRefs.current[index]) {
                variantRefs.current[index].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [selectedVariant, variants]);

    const { isFavorite, toggleFavorite } = useFavorites();

    // Helper to generate slug
    const generateSlug = (text) => text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');

    // Helper for safe UTF-8 decoding
    const safeAtob = (str) => {
        try {
            return decodeURIComponent(escape(atob(str)));
        } catch (e) {
            console.warn("UTF-8 decode failed, falling back to atob", e);
            return atob(str);
        }
    };

    // Calculate expiration
    const updatedAt = ad && ad.$updatedAt ? new Date(ad.$updatedAt) : null;
    const expirationDays = 6; // Strict 6 days expiration as per requirements
    // Calculate expiration date based on updatedAt + 6 days
    const expirationDate = updatedAt ? new Date(updatedAt.getTime() + expirationDays * 24 * 60 * 60 * 1000) : null;

    const now = new Date();
    // Calculate time remaining
    const timeRemaining = expirationDate ? expirationDate - now : 0;

    // Calculate display values
    const daysRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60 * 24)));
    const hoursRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

    const isExpired = !expirationDate || timeRemaining <= 0;
    const isActive = ad?.activo && !isExpired;

    useEffect(() => {
        const cacheKey = `ad_detail_cache_${adId}`;

        // Function to load data from cache
        const loadFromCache = () => {
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const data = JSON.parse(cached);
                    if (data.ad) {
                        setAd(data.ad);
                        if (data.variants) setVariants(data.variants);
                        if (data.advertiserInfo) setAdvertiserInfo(data.advertiserInfo);
                        if (data.relatedAds) setRelatedAds(data.relatedAds);

                        // Set basic things that might rely on ad data logic
                        if (variant_slug && data.variants) {
                            const match = data.variants.find(v => v.slug === variant_slug);
                            if (match) {
                                setSelectedVariant(match);
                                setQuantity(parseInt(match.minQuantity) || 1);
                            }
                        }

                        setLoading(false);
                        return true; // Cache hit
                    }
                }
            } catch (e) {
                console.error("Error loading from cache:", e);
            }
            return false; // Cache miss
        };

        // Function to fetch fresh data
        const fetchNetworkData = async () => {
            try {
                // If we have initialAd and it matches the current ID (which it should), we might skip full fetch
                // But we still need related ads, advertiser info, etc.
                // However, let's keep it simple: fetch everything if not loading from internal cache.
                // If initialAd is present, we already showed the main content.
                // We can let this run in background to fetch related data.


                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                // 1. Fetch Ad Details
                // const adData = await baas.get(`databases/${dbId}/collections/anuncios/documents/${adId}`);

                const adRes = await fetch(`/api/ads/${adId}`);
                if (!adRes.ok) {
                    if (adRes.status === 404) throw new Error("Anuncio no encontrado");
                    throw new Error("Error cargando anuncio");
                }
                const adData = await adRes.json();


                let parsedVariants = [];
                // 2. Parse variants
                if (adData.variants && adData.variants.length > 0) {
                    try {
                        parsedVariants = adData.variants.map(v => {
                            const parsed = JSON.parse(safeAtob(v));
                            const type = parsed.type || parsed.name;
                            const minQuantity = parsed.minQuantity || parsed.units || 1;
                            let price = parsed.price || parsed.unit_price;

                            if (!price && parsed.total_price) {
                                price = parsed.total_price / minQuantity;
                            } else if (!price && typeof parsed.price_raw === 'number') {
                                price = parsed.price_raw;
                            }
                            price = price || 0;

                            let offerText = null;
                            if (parsed.offer) {
                                if (typeof parsed.offer === 'string') {
                                    offerText = parsed.offer;
                                } else if (typeof parsed.offer === 'object' && parsed.offer.label) {
                                    offerText = parsed.offer.label;
                                }
                            }

                            return {
                                ...parsed,
                                type,
                                price,
                                minQuantity,
                                offer: offerText,
                                slug: generateSlug(type)
                            };
                        });

                        // Logic for redirect or selection
                        if (variant_slug) {
                            const match = parsedVariants.find(v => v.slug === variant_slug);
                            if (match) {
                                setSelectedVariant(match);
                                setQuantity(parseInt(match.minQuantity) || 1);
                            }
                        } else if (parsedVariants.length > 0) {
                            // If no variant slug but variants exist, redirect to first variant?
                            // Existing logic did: router.replace(...)
                            // We should keep this logic but be careful not to loop if state updates
                            // Ideally we just select it locally if we want to avoid redirect loop or just do it.
                            const firstVariant = parsedVariants[0];
                            // Only redirect if NOT already on it (checked by variant_slug)
                            // usage of router.replace inside async might be fine.
                            if (!variant_slug) {
                                router.replace(`/${residencialSlug}/anuncio/${adId}/${firstVariant.slug}`);
                            }
                        }

                    } catch (e) {
                        console.error("Error parsing variants:", e);
                    }
                }

                // Update state with fresh ad data
                setAd(adData);
                setVariants(parsedVariants);
                setLoading(false); // Valid data received

                // 3. ASYNC Fetch extras (Advertiser & Related)
                let fetchedAdvertiserInfo = null;
                let fetchedRelated = [];

                // Advertiser lookup
                if (adData.celular_anunciante) {
                    try {
                        const res = await fetch(`/api/users/lookup?phone=${encodeURIComponent(adData.celular_anunciante)}`);
                        if (res.ok) {
                            fetchedAdvertiserInfo = await res.json();
                            setAdvertiserInfo(fetchedAdvertiserInfo);
                        }
                    } catch (err) { console.error("Error looking up advertiser:", err); }
                }

                // Related Ads & Cross Promo
                try {
                    let relatedList = [];
                    let crossList = [];

                    // Fetch related ads from same seller via new BFF route
                    const relatedRes = await fetch(`/api/ads/${adId}/others`);
                    if (relatedRes.ok) {
                        const relatedData = await relatedRes.json();
                        relatedList = (relatedData.documents || []).map(doc => ({ ...doc, isPaid: false }));
                    }

                    // Cross Promo (Paid Ads)
                    const categorySlug = adData.categoria_slug || adData.categoria || '';
                    if (categorySlug) {
                        const params = new URLSearchParams({
                            type: 'cross',
                            limit: '4',
                            category: categorySlug
                        });
                        const res = await fetch(`/api/paid-ads/public?${params}`);
                        if (res.ok) {
                            const data = await res.json();
                            crossList = (data.documents || []).map(doc => ({ ...doc, isPaid: true }));
                        }
                    }

                    fetchedRelated = [...relatedList, ...crossList].sort(() => Math.random() - 0.5);
                    setRelatedAds(fetchedRelated);

                } catch (e) {
                    console.error("Error fetching related:", e);
                }

                // Log View
                import("@/lib/analytics").then(({ logAdView }) => {
                    logAdView(adData.$id, false, null, "view");
                });

                // Save everything to cache
                const cacheData = {
                    ad: adData,
                    variants: parsedVariants,
                    advertiserInfo: fetchedAdvertiserInfo, // might be null
                    relatedAds: fetchedRelated,
                    timestamp: new Date().getTime()
                };
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));

            } catch (err) {
                console.error("Error fetching ad data:", err);
                if (!ad) { // Only show error if we don't have cached data
                    setError("No pudimos cargar la información del anuncio.");
                }
                setLoading(false);
            }
        };

        // Execution Flow
        if (adId) {
            const hasCache = loadFromCache();
            if (!hasCache) {
                setLoading(true);
            }
            // Always fetch fresh data (background revalidation)
            fetchNetworkData();
        }

        // Online Revalidation
        const handleOnline = () => {
            console.log("Online connection restored. Revalidating ad details...");
            fetchNetworkData();
        };

        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('online', handleOnline);
        };

    }, [adId, variant_slug]);

    useEffect(() => {
        if (ad && ad.celular_anunciante && mounted) {
            const globalProfileData = localStorage.getItem('vecivendo_user_global');
            if (globalProfileData) {
                try {
                    const userData = JSON.parse(globalProfileData);
                    const userPhone = userData.telefono || "";
                    // Normalize phone numbers for comparison
                    const normalize = (p) => p.toString().replace(/\D/g, '').slice(-10);
                    if (normalize(userPhone) === normalize(ad.celular_anunciante)) {
                        setIsOwner(true);
                    }
                } catch (e) {
                    console.error("Error parsing user data for ownership check:", e);
                }
            }
        }
    }, [ad, mounted]);

    // Handle Image Modal Closing (Esc & Back Button)
    useEffect(() => {
        if (isImageModalOpen) {
            // Push state to history so back button closes modal instead of navigating away
            window.history.pushState({ modalOpen: true }, '');

            const handlePopState = () => {
                setIsImageModalOpen(false);
            };

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    setIsImageModalOpen(false);
                    // If we closed via ESC, we might need to go back in history if we pushed state
                    // But strictly speaking, pushing state implies we EXPECT back button usage.
                    // If user presses ESC, history remains forward one step. 
                    // Usually better to just go back:
                    if (window.history.state?.modalOpen) {
                        window.history.back();
                    }
                }
            };

            window.addEventListener('popstate', handlePopState);
            window.addEventListener('keydown', handleKeyDown);

            return () => {
                window.removeEventListener('popstate', handlePopState);
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isImageModalOpen]);

    // Reset loading state when image source changes
    // currentImage depends on showOriginals and selectedImage.
    // We can use an effect to force loading state to true when these change
    const images = (showOriginals && ad?.imagenes_originales?.length > 0) ? ad.imagenes_originales : (ad?.imagenes || []);
    const currentImage = images[selectedImage];

    // Determine images to preload (the opposite set)
    const imagesToPreload = (showOriginals)
        ? (ad?.imagenes || [])
        : (ad?.imagenes_originales || []);

    useEffect(() => {
        setIsMainImageLoading(true);
    }, [currentImage]);

    // Helper to close modal and fix history
    const handleCloseModal = () => {
        setIsImageModalOpen(false);
        // If we have our modal state in history, go back to clean it up
        if (window.history.state?.modalOpen) {
            window.history.back();
        }
    };

    const { residential: residentialData } = useResidential(residencialSlug);
    const residentialName = residentialData?.nombre || residencialSlug;
    const residentialId = residentialData?.$id;

    const { addToCart, clearCart } = useCart();
    const { showToast } = useToast();
    const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

    const handleAddToCart = () => {
        // Enforce variant selection if variants exist
        if (variants.length > 0 && !selectedVariant) {
            showToast("Por favor selecciona una opción", "error");
            // Scroll to variants?
            return;
        }

        let productToAdd = { ...ad };

        if (selectedVariant) {
            productToAdd = {
                ...productToAdd,
                $id: `${ad.$id}-${selectedVariant.slug}`,
                adId: ad.$id,
                price: selectedVariant.price,
                variant: selectedVariant.type,
                variantSlug: selectedVariant.slug,
                offer: selectedVariant.offer,
                minQuantity: parseInt(selectedVariant.minQuantity)
            };
        }

        const result = addToCart(productToAdd, quantity);

        if (result.success) {
            showToast(`${quantity} artículo(s) agregado(s) al carrito`, "success");
            import("@/lib/analytics").then(({ logAdView }) => {
                logAdView(ad.$id, false, null, "click");
            });
        } else if (result.error === "advertiser_mismatch") {
            setIsConflictModalOpen(true);
        } else {
            showToast("Error al agregar al carrito", "error");
        }
    };

    const handleConfirmCartOverwrite = () => {
        clearCart();
        // Recalculate productToAdd because handleAddToCart scope is gone
        // Actually simple call handleAddToCart again?
        // No, need to clear first.

        let productToAdd = { ...ad };
        if (selectedVariant) {
            productToAdd = {
                ...productToAdd,
                $id: `${ad.$id}-${selectedVariant.slug}`,
                adId: ad.$id,
                price: selectedVariant.price,
                variant: selectedVariant.type,
                variantSlug: selectedVariant.slug,
                offer: selectedVariant.offer,
                minQuantity: parseInt(selectedVariant.minQuantity)
            };
        }

        addToCart(productToAdd, quantity);
        showToast("Carrito actualizado con el nuevo producto", "success");
        setIsConflictModalOpen(false);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: ad.titulo,
                    text: `Mira este ${ad.titulo} que ha publicado un vecino en Vecivendo,\n${window.location.href}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            setIsShareOpen(true);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    if (loading) {
        return <AdDetailSkeleton />;
    }

    if (error || !ad) {
        return (
            <div className="min-h-screen flex flex-col bg-background" style={{ paddingTop: 'var(--alert-bar-height, 0px)' }}>
                <CommunityAlertBar residentialSlug={residencialSlug} />
                <HomeHeader residencialName={residentialName} showSearch={false} showFilters={false} />

                <div className="flex-grow flex flex-col items-center justify-center p-4 text-center pt-20">
                    <AlertCircle className="text-red-500 mb-4" size={48} />
                    <h1 className="text-2xl font-bold text-text-main mb-2">Anuncio no encontrado</h1>
                    <p className="text-text-secondary mb-6">{error || "El anuncio que buscas no existe o fue eliminado."}</p>
                    <Link href={`/${residencialSlug}`}>
                        <Button>Volver al catálogo</Button>
                    </Link>
                </div>
            </div>
        );
    }



    // Dynamic Title
    let displayTitle = ad.titulo;
    if (selectedVariant) {
        const variantName = selectedVariant.type || "";
        const adTitle = ad.titulo || "";
        // If variant name is not contained in ad title (case insensitive), prepend it
        if (!adTitle.toLowerCase().includes(variantName.toLowerCase())) {
            displayTitle = `${variantName} - ${adTitle}`;
        }
    }
    // Price to show
    const displayPrice = selectedVariant ? selectedVariant.price : (variants.length > 0 ? variants[0].price : ad.precio);
    // If variants exist but none selected, maybe show "Desde" or range?
    // Request says: "Cuando un anuncio tiene varaintes no poner el precio Standard sino solo las varaintes".
    // I will show the lowest price if none selected?
    const lowestPrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : ad.precio;
    const finalDisplayPrice = selectedVariant ? selectedVariant.price : (variants.length > 0 ? lowestPrice : ad.precio);


    return (
        <div className="min-h-screen bg-background pb-24" style={{ paddingTop: 'var(--alert-bar-height, 0px)' }}>
            <CommunityAlertBar residentialSlug={residencialSlug} />
            <HomeHeader residencialName={residentialName} residentialSlug={residencialSlug} showSearch={false} showFilters={false} />

            <main className="max-w-7xl mx-auto px-4 pt-8 md:pt-20">
                {/* Header Actions */}
                <div className="flex flex-row items-center justify-between gap-4 mb-6">
                    <Link href={`/${residencialSlug}`} className="inline-flex items-center text-text-secondary hover:text-primary transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        <span className="font-medium hidden xs:inline">Volver al catálogo</span>
                        <span className="font-medium xs:hidden">Volver</span>
                    </Link>

                    {isOwner && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowMetricsModal(true)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-text-secondary hover:text-primary hover:border-primary transition-all shadow-sm group"
                                title="Métricas"
                            >
                                <BarChart3 size={18} className="group-hover:scale-110 transition-transform" />
                                <span className="font-semibold hidden sm:inline">Métricas</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsNavigatingToEdit(true);
                                    router.push(`/${residencialSlug}/anuncio/${adId}/editar`);
                                }}
                                disabled={isNavigatingToEdit}
                                className={`inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-primary text-white rounded-xl transition-all shadow-lg shadow-primary/20 ${isNavigatingToEdit
                                        ? 'opacity-70 cursor-not-allowed'
                                        : 'hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                                title="Editar"
                            >
                                {isNavigatingToEdit ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Pencil size={18} />
                                )}
                                <span className="font-semibold hidden sm:inline">Editar</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div
                            className="aspect-square bg-surface rounded-2xl overflow-hidden border border-border relative group cursor-zoom-in"
                            onClick={() => setIsImageModalOpen(true)}
                        >
                            {currentImage ? (
                                <>
                                    <Image
                                        src={currentImage}
                                        alt={ad.titulo}
                                        fill
                                        className={`object-cover transition-opacity duration-300 ${isMainImageLoading ? 'opacity-80' : 'opacity-100'}`}
                                        priority
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        onLoad={() => setIsMainImageLoading(false)}
                                    />
                                    {isMainImageLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] z-10">
                                            <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow-lg" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-secondary">
                                    <Package size={64} className="opacity-30" />
                                </div>
                            )}

                            {/* Hidden Preloader for Background Images */}
                            <div className="hidden" aria-hidden="true">
                                {imagesToPreload.map((imgSrc, idx) => (
                                    <img key={`preload-${idx}`} src={imgSrc} alt="" />
                                ))}
                            </div>

                            {/* Share & Favorite buttons */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleShare(); }}
                                    className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-transparent hover:border-primary transition-all hover:scale-110"
                                >
                                    <Share2 size={20} className="text-gray-700" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); ad && toggleFavorite(e, ad.$id); }}
                                    className={`p-3 backdrop-blur-sm rounded-full shadow-lg transition-all hover:scale-110 border border-transparent hover:border-red-500 ${isFavorite(ad.$id) ? 'bg-white text-red-500' : 'bg-white/90 text-gray-700'}`}
                                >
                                    <Heart size={20} className={isFavorite(ad.$id) ? "fill-current" : ""} />
                                </button>
                            </div>

                            {/* AI Toggle Overlay */}
                            {ad.imagen_ia && (
                                <div
                                    role="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowOriginals(!showOriginals);
                                    }}
                                    className="absolute bottom-4 left-4 right-4 p-3 bg-black/20 backdrop-blur-md flex items-center justify-between z-20 rounded-xl border border-white/10 cursor-pointer hover:bg-black/50 transition-all group/toggle"
                                >
                                    <div className="flex items-center gap-2 text-white">
                                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs font-medium shadow-black/50 drop-shadow-sm">
                                            {(ad.imagenes?.length > 1)
                                                ? "Mejoradas con IA"
                                                : "Mejorada con IA"
                                            }
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-medium text-white/90 transition-colors group-hover/toggle:text-white hidden sm:block">
                                            {showOriginals ? "Volver a IA" : "Ver originales"}
                                        </span>
                                        {/* Mobile text simplified or just keep the switch? User asked for text "desktop alignment". I will keep it visible but maybe shorter on mobile if space is tight. Container is absolute left-4 right-4. It should fit. */}
                                        <span className="text-[10px] font-medium text-white/90 sm:hidden">
                                            {showOriginals ? "Volver" : "Originales"}
                                        </span>

                                        <div
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showOriginals ? 'bg-white/20' : 'bg-primary'}`}
                                        >
                                            <span
                                                className={`${showOriginals ? 'translate-x-4' : 'translate-x-1'} flex items-center justify-center h-3 w-3 transform rounded-full bg-white transition-transform`}
                                            >
                                                {showOriginals
                                                    ? <Eye size={8} className="text-gray-900" />
                                                    : <EyeOff size={8} className="text-primary" />
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Gallery */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                                            ? 'border-primary ring-2 ring-primary/20'
                                            : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <img src={img} alt={`${ad.titulo} ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Category Badge */}
                        <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold uppercase tracking-wide">
                            {ad.categoria}
                        </span>

                        {/* Title & Price */}
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4 leading-tight">
                                {displayTitle}
                            </h1>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl md:text-5xl font-bold text-primary">
                                    {formatPrice(finalDisplayPrice)}
                                </span>
                                <span className="text-text-secondary text-lg">{ad.moneda || 'MXN'}</span>
                            </div>
                            {selectedVariant && (
                                <p className="text-sm text-text-secondary mt-1">
                                    Precio por {selectedVariant.type} (Mínimo {selectedVariant.minQuantity} unidades)
                                </p>
                            )}
                            {!selectedVariant && variants.length > 0 && (
                                <p className="text-sm text-text-secondary mt-1">
                                    Desde {formatPrice(lowestPrice)}
                                </p>
                            )}
                        </div>

                        {/* Variants Selector */}
                        {variants.length > 1 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                                    Selecciona una opción
                                </h3>
                                <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-3 snap-x snap-mandatory sm:flex-wrap sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide">
                                    {/* variants.map... */}
                                    {variants.map((variant, idx) => (
                                        <button
                                            key={idx}
                                            ref={el => variantRefs.current[idx] = el}
                                            onClick={() => router.push(`/${residencialSlug}/anuncio/${adId}/${variant.slug}`)}
                                            className={`px-4 py-3 rounded-xl border transition-all text-left relative min-w-[80%] sm:min-w-0 sm:w-auto shrink-0 snap-center flex flex-col gap-1 ${selectedVariant && selectedVariant.slug === variant.slug
                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                : 'bg-surface text-text-main border-border hover:border-primary'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between w-full gap-4">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="font-medium truncate">{variant.type}</span>
                                                    {variant.offer && (
                                                        <Gift size={14} className={selectedVariant && selectedVariant.slug === variant.slug ? 'text-white' : 'text-primary'} />
                                                    )}
                                                </div>
                                                <div className={`font-bold whitespace-nowrap ${selectedVariant && selectedVariant.slug === variant.slug ? 'text-white' : 'text-primary'}`}>
                                                    {formatPrice(variant.price)}
                                                </div>
                                            </div>

                                            {parseInt(variant.minQuantity) > 1 && (
                                                <div className={`text-xs ${selectedVariant && selectedVariant.slug === variant.slug ? 'text-white/80' : 'text-text-secondary'}`}>
                                                    Pack de {variant.minQuantity} unidades
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Offer Details */}
                                {selectedVariant && selectedVariant.offer && (
                                    <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="p-2 bg-primary/10 rounded-full shrink-0">
                                            <Gift size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-primary text-sm mb-0.5">¡Oferta Especial!</h4>
                                            <p className="text-sm text-text-main">{selectedVariant.offer}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Expiration Info */}
                        {mounted && (
                            <div className="flex items-center gap-2 text-sm text-text-secondary bg-surface border border-border px-3 py-2 rounded-lg w-fit">
                                <Clock size={16} className={isExpired ? "text-red-500" : "text-primary"} />
                                <span>
                                    {isExpired
                                        ? "Este anuncio ha caducado"
                                        : `Caduca en: ${daysRemaining}d ${hoursRemaining}h`
                                    }
                                </span>
                                <span className="text-xs text-gray-400 border-l border-border pl-2 ml-1">
                                    {updatedAt?.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-surface rounded-xl p-6 border border-border">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                                Descripción
                            </h3>
                            <p className="text-text-main leading-relaxed whitespace-pre-line">
                                {ad.descripcion || "Sin descripción disponible."}
                            </p>
                        </div>

                        {/* Reviews Section */}
                        <ReviewsSection adId={adId} onModalOpenChange={setIsReviewsModalOpen} />

                        {/* Seller Info */}
                        <div className="bg-surface rounded-xl p-6 border border-border">
                            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
                                Anunciante
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                                    <UserIcon className="text-primary" size={28} />
                                </div>
                                <div className="flex-1">
                                    <p
                                        key={advertiserInfo ? 'real-name' : 'placeholder-name'}
                                        className="font-semibold text-text-main text-lg animate-in fade-in duration-300"
                                    >
                                        {advertiserInfo ? advertiserInfo.name : (ad.celular_anunciante ? `Vecino (${ad.celular_anunciante.slice(-4)})` : "Vecino de la comunidad")}
                                    </p>
                                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                                        {/* Fake ratings removed */}
                                        {/* Only show if we had real ratings, e.g. advertiserInfo.rating */}
                                        {mounted && advertiserInfo && advertiserInfo.createdAt && (
                                            <span>Miembro desde {new Date(advertiserInfo.registrationDate).getFullYear()}</span>
                                        )}
                                        {!advertiserInfo && (
                                            <span>Vecino verificado</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Related Products & Cross Promo Mixed */}
                {
                    relatedAds.length > 0 && (
                        <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-forwards">
                            <h2 className="text-2xl font-bold text-text-main mb-6">También podría interesarte...</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {relatedAds.map(item => {
                                    if (item.isPaid) {
                                        return (
                                            <PaidAdCard
                                                key={item.$id}
                                                ad={item}
                                                residentialSlug={residencialSlug}
                                                viewMode="grid"
                                                currency={item.moneda || 'MXN'}
                                            />
                                        );
                                    }

                                    const related = item;
                                    const relatedImages = related.imagenes || [];
                                    const firstImage = relatedImages[0];

                                    return (
                                        <Link
                                            key={related.$id}
                                            href={`/${residencialSlug}/anuncio/${related.$id}`}
                                            className="group bg-surface rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                        >
                                            <div className="aspect-square bg-gray-100 dark:bg-white/5 relative overflow-hidden">
                                                {firstImage ? (
                                                    <img
                                                        src={firstImage}
                                                        alt={related.titulo}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package size={32} className="text-text-secondary opacity-30" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <h3 className="font-medium text-text-main line-clamp-2 text-sm mb-2 group-hover:text-primary transition-colors">
                                                    {related.titulo}
                                                </h3>
                                                <p className="text-lg font-bold text-primary">
                                                    {formatPrice(related.precio)}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )
                }
            </main >

            {/* Fixed Bottom Bar */}
            {
                !isReviewsModalOpen && (
                    <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-border z-50 pb-safe">
                        <div className="max-w-7xl mx-auto px-4 py-4">
                            <div className="flex items-center gap-3">
                                {/* Home Button */}
                                <Link href={`/${residencialSlug}`}>
                                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-full">
                                        <Home size={22} />
                                    </Button>
                                </Link>

                                {/* Quantity Selector */}
                                <div className={`flex items-center gap-2 bg-background rounded-full border border-border px-3 h-14 ${!isActive ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <button
                                        onClick={() => setQuantity(Math.max((selectedVariant ? parseInt(selectedVariant.minQuantity) : 1), quantity - 1))}
                                        className="p-2 border border-transparent hover:border-primary rounded-full transition-colors"
                                        disabled={quantity <= (selectedVariant ? parseInt(selectedVariant.minQuantity) : 1)}
                                    >
                                        <Minus size={20} className={quantity <= (selectedVariant ? parseInt(selectedVariant.minQuantity) : 1) ? 'text-text-secondary/50' : 'text-text-main'} />
                                    </button>
                                    <span className="w-12 text-center font-bold text-text-main text-lg">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="p-2 border border-transparent hover:border-primary rounded-full transition-colors"
                                    >
                                        <Plus size={20} className="text-text-main" />
                                    </button>
                                </div>

                                {/* Add to Cart Button */}
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!isActive}
                                    className={`flex-1 h-14 gap-2 text-base font-semibold rounded-2xl ${!isActive ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300' : ''}`}
                                >
                                    <ShoppingCart size={20} />
                                    {isActive ? (
                                        <>
                                            <span className="hidden md:inline">Agregar al carrito • </span>
                                            {/* Show price of selected variant, or range if none selected but variants exist? */}
                                            {/* If no variant selected and variants exist, showing total based on lowest price might be confusing. */}
                                            {/* Let's show "Desde..." or just price. */}
                                            <span>{formatPrice(finalDisplayPrice * quantity)}</span>
                                        </>
                                    ) : 'No disponible'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                url={typeof window !== 'undefined' ? window.location.href : ''}
                title={ad.titulo}
            />

            <ConfirmationModal
                isOpen={isConflictModalOpen}
                onClose={() => setIsConflictModalOpen(false)}
                onConfirm={handleConfirmCartOverwrite}
                title="Diferente Anunciante"
                message="Si deseas hacer pedidos de más de un anunciante, tienes que hacerlos por separado. ¿Deseas vaciar tu carrito actual y agregar este producto?"
                confirmText="Vaciar y Agregar"
                cancelText="Cancelar"
                variant="primary"
            />

            {/* Fullscreen Image Modal */}
            {isImageModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={handleCloseModal}>
                    <button
                        onClick={handleCloseModal}
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-[110]"
                    >
                        <X size={32} />
                    </button>

                    <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-300 ease-out" onClick={(e) => e.stopPropagation()}>
                        {currentImage && (
                            <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                <TransformWrapper
                                    initialScale={1}
                                    minScale={0.5}
                                    maxScale={4}
                                    centerOnInit={true}
                                >
                                    <TransformComponent
                                        wrapperClass="!w-full !h-full flex items-center justify-center"
                                        contentClass="!w-full !h-full flex items-center justify-center"
                                    >
                                        <img
                                            src={currentImage}
                                            alt="Vista previa"
                                            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                                            style={{ maxHeight: 'calc(100vh - 40px)', maxWidth: '100vw' }}
                                        />
                                    </TransformComponent>
                                </TransformWrapper>
                            </div>
                        )}

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
                                    }}
                                    className="absolute left-2 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm transition-all"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage((prev) => (prev + 1) % images.length);
                                    }}
                                    className="absolute right-2 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm transition-all"
                                >
                                    <ChevronRight size={32} />
                                </button>

                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-sm backdrop-blur-sm">
                                    {selectedImage + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {/* Metrics Modal */}
            {showMetricsModal && isOwner && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowMetricsModal(false)}
                    />
                    <div className="relative bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                                <BarChart3 className="text-primary" />
                                Analítica del Anuncio
                            </h2>
                            <button
                                onClick={() => setShowMetricsModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                            <AdAnalytics ad={ad} />
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
