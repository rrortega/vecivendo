"use client";

import { useState, useEffect } from 'react';
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";
import { HomeHeader } from "@/components/home/HomeHeader";
import { CommunityAlertBar } from "@/components/layout/CommunityAlertBar";
import { Button } from "@/components/ui/Button";
import { Loader2, AlertCircle, ArrowLeft, MessageCircle, Share2, ShoppingCart, Plus, Minus, User as UserIcon, Package, Heart, Home, Star } from "lucide-react";
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
    const { residencial: residencialSlug, id: adId } = params;
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ad, setAd] = useState(null);
    const [relatedAds, setRelatedAds] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);

    const { isFavorite, toggleFavorite } = useFavorites();

    // Calculate expiration
    const updatedAt = ad ? new Date(ad.$updatedAt) : null;
    const expirationDate = updatedAt ? new Date(updatedAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
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

                // Fetch Related Ads from same seller (anunciante)
                // We try to find the advertiser ID from common fields.
                const advertiserId = adData.userId || adData.user_id || adData.anuncianteId;

                if (advertiserId) {
                    // Determine which field matched to use in the query
                    const queryField = adData.userId ? 'userId' : (adData.user_id ? 'user_id' : 'anuncianteId');

                    const relatedList = await databases.listDocuments(
                        dbId,
                        "anuncios",
                        [
                            Query.equal(queryField, advertiserId),
                            Query.equal("activo", true),
                            Query.notEqual("$id", adId),
                            Query.limit(4)
                        ]
                    );
                    setRelatedAds(relatedList.documents);
                } else {
                    // If no advertiser ID found, we can't show ads from the same advertiser.
                    // However, to avoid empty section if data is missing, we could fallback to residential ads?
                    // User requested "solo si hay mas anuncios de ese anunciante".
                    // So we keep it empty if we can't identify the advertiser.
                    console.log("No advertiser ID found in ad data:", adData);
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
    }, [adId]);

    const { residential: residentialData } = useResidential(residencialSlug);
    const residentialName = residentialData?.nombre || residencialSlug;
    const residentialId = residentialData?.$id;

    const { addToCart, clearCart } = useCart();
    const { showToast } = useToast();
    const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

    const handleAddToCart = () => {
        const result = addToCart(ad, quantity);

        if (result.success) {
            showToast(`${quantity} artículo(s) agregado(s) al carrito`, "success");
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
                <HomeHeader residencialName={residentialName} />

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
            <HomeHeader residencialName={residentialName} residentialSlug={residencialSlug} />

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
                                    {formatPrice(ad.precio)}
                                </span>
                                <span className="text-text-secondary text-lg">{ad.moneda || 'MXN'}</span>
                            </div>
                        </div>

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
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-2 border border-transparent hover:border-primary rounded-full transition-colors"
                                        disabled={quantity <= 1}
                                    >
                                        <Minus size={20} className={quantity <= 1 ? 'text-text-secondary/50' : 'text-text-main'} />
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
                                    {isActive ? `Agregar al carrito • ${formatPrice(ad.precio * quantity)}` : 'No disponible'}
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
