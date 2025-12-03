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

export default function AdDetailPage({ params }) {
    const { residencial: residencialSlug, id: adId, variant_slug } = params;
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ad, setAd] = useState(null);
    const [relatedAds, setRelatedAds] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);

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

                // Parse Variants
                if (adData.variants && adData.variants.length > 0) {
                    try {
                        const parsedVariants = adData.variants.map(v => {
                            const parsed = JSON.parse(atob(v));
                            // Map fields to consistent structure
                            // Support both schemas: 
                            // New: type, price, minQuantity, offer
                            // Old/Existing: name, total_price (or price_raw), units, offer (object or string)

                            const type = parsed.type || parsed.name;
                            const minQuantity = parsed.minQuantity || parsed.units || 1;
                            let price = parsed.price || parsed.unit_price;

                            if (!price && parsed.total_price) {
                                price = parsed.total_price / minQuantity;
                            } else if (!price && typeof parsed.price_raw === 'number') {
                                price = parsed.price_raw;
                            }

                            price = price || 0;

                            // Handle offer: could be string or object
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

                        // Select variant based on slug or default to null (main ad)
                        if (variant_slug) {
                            const match = parsedVariants.find(v => v.slug === variant_slug);
                            if (match) {
                                setSelectedVariant(match);
                                setQuantity(parseInt(match.minQuantity) || 1);
                            }
                        } else {
                            setSelectedVariant(null);
                        }
                    } catch (e) {
                        console.error("Error parsing variants:", e);
                    }
                }

                // Log View
                import("@/lib/analytics").then(({ logAdView }) => {
                    // Log view with variant info if selected
                    // We might need to wait for state update or just pass it directly
                    // For now, logging the main ad view. 
                    // Ideally, we should log the specific variant view if applicable.
                    logAdView(adData.$id, false, null, "view");
                });

                // Fetch Related Ads from same seller (anunciante)
                // Priority: celular > userId > user_id > anuncianteId
                let queryField = null;
                let queryValue = null;

                if (adData.celular) {
                    queryField = 'celular';
                    queryValue = adData.celular;
                } else if (adData.userId) {
                    queryField = 'userId';
                    queryValue = adData.userId;
                } else if (adData.user_id) {
                    queryField = 'user_id';
                    queryValue = adData.user_id;
                } else if (adData.anuncianteId) {
                    queryField = 'anuncianteId';
                    queryValue = adData.anuncianteId;
                }

                if (queryField && queryValue) {
                    const relatedList = await databases.listDocuments(
                        dbId,
                        "anuncios",
                        [
                            Query.equal(queryField, queryValue),
                            Query.equal("active", true), // Ensure we use 'active' or 'activo' consistently. Schema says 'active' in some places.
                            Query.notEqual("$id", adId),
                            Query.limit(4)
                        ]
                    );
                    setRelatedAds(relatedList.documents);
                } else {
                    console.log("No advertiser identifier found in ad data:", adData);
                    setRelatedAds([]);
                }

            } catch (err) {
                console.error("Error fetching ad data:", err);
                setError("No pudimos cargar la información del anuncio.");
            } finally {
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
        let productToAdd = { ...ad };

        if (selectedVariant) {
            // Create a composite ID for the cart item to distinguish variants
            productToAdd = {
                ...productToAdd,
                $id: `${ad.$id}-${selectedVariant.slug}`,
                adId: ad.$id, // Keep reference to original ad ID
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
            // Log add to cart interaction
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
        addToCart(ad, quantity);
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
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
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

    return (
        <div className="min-h-screen bg-background pb-24" style={{ paddingTop: 'var(--alert-bar-height, 0px)' }}>
            <CommunityAlertBar residentialSlug={residencialSlug} />
            <HomeHeader residencialName={residentialName} residentialSlug={residencialSlug} showSearch={false} showFilters={false} />

            <main className="max-w-7xl mx-auto px-4 pt-20 md:pt-24">
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
                                <img
                                    src={currentImage}
                                    alt={ad.titulo}
                                    className="w-full h-full object-cover"
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
                                {ad.titulo}
                            </h1>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl md:text-5xl font-bold text-primary">
                                    {formatPrice(selectedVariant ? selectedVariant.price : ad.precio)}
                                </span>
                                <span className="text-text-secondary text-lg">{ad.moneda || 'MXN'}</span>
                            </div>
                            {selectedVariant && (
                                <p className="text-sm text-text-secondary mt-1">
                                    Precio por {selectedVariant.type} (Mínimo {selectedVariant.minQuantity} unidades)
                                </p>
                            )}
                        </div>

                        {/* Variants Selector */}
                        {variants.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                                    Variantes disponibles
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => router.push(`/${residencialSlug}/anuncio/${adId}`)}
                                        className={`px-4 py-2 rounded-lg border transition-all text-left relative ${!selectedVariant
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-surface text-text-main border-border hover:border-primary'
                                            }`}
                                    >
                                        <div className="font-medium">Estándar</div>
                                        <div className={`text-xs ${!selectedVariant ? 'text-white/80' : 'text-text-secondary'}`}>
                                            {formatPrice(ad.precio)}
                                        </div>
                                    </button>
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
                            <p className="text-text-main leading-relaxed">
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
                                    <p className="font-semibold text-text-main text-lg">Vecino de {residentialName}</p>
                                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium text-text-main">4.9</span>
                                        <span>(24 reseñas)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {
                    relatedAds.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-text-main mb-6">Más anuncios de este anunciante</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {relatedAds.map(related => {
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
                                            <span>{formatPrice((selectedVariant ? selectedVariant.price : ad.precio) * quantity)}</span>
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
