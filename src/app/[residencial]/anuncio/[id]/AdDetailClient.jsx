"use client";

import { useState, useEffect } from 'react';
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";
import { HomeHeader } from "@/components/home/HomeHeader";
import { CommunityAlertBar } from "@/components/layout/CommunityAlertBar";
import { Button } from "@/components/ui/Button";
import { Loader2, AlertCircle, ArrowLeft, MessageCircle, Share2, ShoppingCart, Plus, Minus, User as UserIcon, Package, Heart, Home, Star, Gift } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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

export default function AdDetailPage({ params }) {
    const { residencial: residencialSlug, id: adId, variant_slug } = params;
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ad, setAd] = useState(null);
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
    const updatedAt = ad ? new Date(ad.$updatedAt) : null;
    const validityDays = ad?.dias_vigencia || 7;
    const expirationDate = updatedAt ? new Date(updatedAt.getTime() + validityDays * 24 * 60 * 60 * 1000) : null;
    const now = new Date();
    const timeRemaining = expirationDate ? expirationDate - now : 0;
    const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const isExpired = timeRemaining <= 0;
    const isActive = ad?.activo && !isExpired;

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                // Fetch Ad Details
                const adData = await databases.getDocument(dbId, "anuncios", adId);
                setAd(adData);

                // Initialize variants immediately
                if (adData.variants && adData.variants.length > 0) {
                    // ... (Variant parsing logic, same as before)
                    try {
                        const parsedVariants = adData.variants.map(v => {
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
                        setVariants(parsedVariants);

                        if (variant_slug) {
                            const match = parsedVariants.find(v => v.slug === variant_slug);
                            if (match) {
                                setSelectedVariant(match);
                                setQuantity(parseInt(match.minQuantity) || 1);
                            }
                        } else if (parsedVariants.length > 0) {
                            const firstVariant = parsedVariants[0];
                            router.replace(`/${residencialSlug}/anuncio/${adId}/${firstVariant.slug}`);
                            // We can continue rendering, the redirect will happen
                        }
                    } catch (e) {
                        console.error("Error parsing variants:", e);
                    }
                }

                // UNBLOCK RENDER HERE
                setLoading(false);

                // ASYNC: Fetch Advertiser Info
                if (adData.celular_anunciante) {
                    fetch(`/api/users/lookup?phone=${encodeURIComponent(adData.celular_anunciante)}`)
                        .then(res => res.ok ? res.json() : null)
                        .then(userData => {
                            if (userData) setAdvertiserInfo(userData);
                        })
                        .catch(err => console.error("Error looking up advertiser:", err));
                }

                // ASYNC: Fetch Related Ads & Cross Promo
                (async () => {
                    let relatedList = [];
                    let crossList = [];

                    // 1. Fetch Related (Same Advertiser)
                    let queryField = null;
                    let queryValue = null;

                    if (adData.celular) { queryField = 'celular'; queryValue = adData.celular; }
                    else if (adData.userId) { queryField = 'userId'; queryValue = adData.userId; }
                    else if (adData.user_id) { queryField = 'user_id'; queryValue = adData.user_id; }
                    else if (adData.anuncianteId) { queryField = 'anuncianteId'; queryValue = adData.anuncianteId; }
                    else if (adData.celular_anunciante) { queryField = 'celular_anunciante'; queryValue = adData.celular_anunciante; }

                    if (queryField && queryValue) {
                        try {
                            const res = await databases.listDocuments(
                                dbId, "anuncios",
                                [
                                    Query.equal(queryField, queryValue),
                                    Query.equal("activo", true),
                                    Query.notEqual("$id", adId),
                                    Query.limit(6)
                                ]
                            );
                            relatedList = res.documents.map(doc => ({ ...doc, isPaid: false }));
                        } catch (e) { console.error("Error fetching related:", e); }
                    }

                    // 2. Fetch Cross Promo Ads (Matching Category)
                    try {
                        const categorySlug = adData.categoria_slug || adData.categoria || '';
                        if (categorySlug) {
                            const params = new URLSearchParams({
                                type: 'cross',
                                limit: '4', // Fetch a few to mix in
                                category: categorySlug
                            });
                            const res = await fetch(`/api/paid-ads/public?${params}`);
                            if (res.ok) {
                                const data = await res.json();
                                crossList = (data.documents || []).map(doc => ({ ...doc, isPaid: true }));
                            }
                        }
                    } catch (e) {
                        console.error("Error fetching cross promo ads:", e);
                    }

                    // 3. Mix lists
                    // Simple mix: Alternate or append?
                    // "mezclamos los otros anuncios... con la publicidad de tipo cross"
                    // Let's create a combined list, shuffled or interleaved.
                    const combined = [...relatedList, ...crossList].sort(() => Math.random() - 0.5);
                    setRelatedAds(combined);
                })();


                // Log View
                import("@/lib/analytics").then(({ logAdView }) => {
                    logAdView(adData.$id, false, null, "view");
                });

                // Removed standalone CrossPromoAd fetch as it's now integrated
            } catch (err) {
                console.error("Error fetching ad data:", err);
                setError("No pudimos cargar la información del anuncio.");
                setLoading(false);
            }
        }

        if (adId) {
            fetchData();
        }
    }, [adId, variant_slug]);

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

    const images = ad.imagenes || [];
    const currentImage = images[selectedImage];

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
                {/* Back Button */}
                <Link href={`/${residencialSlug}`} className="inline-flex items-center text-text-secondary hover:text-primary mb-6 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    <span className="font-medium">Volver al catálogo</span>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-surface rounded-2xl overflow-hidden border border-border relative group">
                            {currentImage ? (
                                <Image
                                    src={currentImage}
                                    alt={ad.titulo}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-secondary">
                                    <Package size={64} className="opacity-30" />
                                </div>
                            )}

                            {/* Share & Favorite buttons */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={handleShare}
                                    className="p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-transparent hover:border-primary transition-all hover:scale-110"
                                >
                                    <Share2 size={20} className="text-gray-700" />
                                </button>
                                <button
                                    onClick={(e) => ad && toggleFavorite(e, ad.$id)}
                                    className={`p-3 backdrop-blur-sm rounded-full shadow-lg transition-all hover:scale-110 border border-transparent hover:border-red-500 ${isFavorite(ad.$id) ? 'bg-white text-red-500' : 'bg-white/90 text-gray-700'}`}
                                >
                                    <Heart size={20} className={isFavorite(ad.$id) ? "fill-current" : ""} />
                                </button>
                            </div>
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
                        {variants.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                                    Selecciona una opción
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {/* Standard Option: Hidden if variants exist per request */}
                                    {/* variants.map... */}
                                    {variants.map((variant, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => router.push(`/${residencialSlug}/anuncio/${adId}/${variant.slug}`)}
                                            className={`px-4 py-2 rounded-lg border transition-all text-left relative ${selectedVariant && selectedVariant.slug === variant.slug
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-surface text-text-main border-border hover:border-primary'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{variant.type}</span>
                                                {variant.offer && (
                                                    <Gift size={14} className={selectedVariant && selectedVariant.slug === variant.slug ? 'text-white' : 'text-primary'} />
                                                )}
                                            </div>
                                            <div className={`text-xs ${selectedVariant && selectedVariant.slug === variant.slug ? 'text-white/80' : 'text-text-secondary'}`}>
                                                {formatPrice(variant.price)}
                                                {parseInt(variant.minQuantity) > 1 && ` x ${variant.minQuantity}`}
                                            </div>
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
                                        {advertiserInfo && advertiserInfo.createdAt && (
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
        </div >
    );
}
