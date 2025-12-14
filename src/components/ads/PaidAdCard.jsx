"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ImageOff, ExternalLink, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ExternalRedirectOverlay from "./ExternalRedirectOverlay";
import { getSessionId } from "@/lib/analytics";

/**
 * PaidAdCard - Displays an embedded-type paid ad that looks like a regular product card
 * @param {Object} ad - The paid ad document
 * @param {string} residentialSlug - Current residential slug
 * @param {string} viewMode - 'grid' or 'list'
 * @param {string} currency - Currency code for formatting
 */
export default function PaidAdCard({ ad, residentialSlug, viewMode = "grid", currency = "MXN" }) {
    const [hasTrackedView, setHasTrackedView] = useState(false);
    const [showRedirectOverlay, setShowRedirectOverlay] = useState(false);
    const cardRef = useRef(null);

    // Check if view was already tracked in this session
    useEffect(() => {
        if (!ad?.$id) return;
        const viewedKey = `paid_ad_viewed_${ad.$id}`;
        if (sessionStorage.getItem(viewedKey)) {
            setHasTrackedView(true);
        }
    }, [ad?.$id]);

    // Track view when card becomes visible (only once per session)
    useEffect(() => {
        if (hasTrackedView || !ad?.$id) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    const viewedKey = `paid_ad_viewed_${ad.$id}`;
                    if (!sessionStorage.getItem(viewedKey)) {
                        fetch('/api/paid-ads/track', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                adId: ad.$id,
                                type: 'view',
                                sessionId: getSessionId()
                            })
                        }).catch(console.error);
                        sessionStorage.setItem(viewedKey, 'true');
                    }
                    setHasTrackedView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [ad?.$id, hasTrackedView]);

    if (!ad) return null;

    const isExternal = ad.link?.startsWith('http');
    const imageUrl = ad.image_url || ad.imagen;

    // Check if external link is NOT vecivendo.com
    const isExternalNonVecivendo = isExternal && !ad.link?.includes('vecivendo.com');

    const handleClick = (e) => {
        // Track click
        fetch('/api/paid-ads/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                adId: ad.$id,
                type: 'click',
                sessionId: getSessionId()
            })
        }).catch(console.error);

        // If external non-vecivendo link, show overlay instead of navigating directly
        if (isExternalNonVecivendo) {
            e.preventDefault();
            setShowRedirectOverlay(true);
        }
    };

    // EXACT same card style as free ads in ProductGrid
    const cardClasses = `group bg-surface rounded-xl overflow-hidden border border-gray-200 dark:border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${viewMode === "list" ? "flex flex-row h-40 md:h-48" : ""
        }`;

    const CardContent = () => (
        <>
            {/* Image Section - EXACT same as free ads */}
            <div className={`${viewMode === "list" ? "w-40 md:w-56 shrink-0" : "aspect-[4/3]"} relative overflow-hidden bg-gray-100 dark:bg-white/5`}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={ad.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-secondary">
                        <ImageOff size={24} className="opacity-50" />
                    </div>
                )}

                {/* ADV Badge - Small and subtle */}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500/90 backdrop-blur-sm text-white text-[9px] font-bold rounded uppercase tracking-wider">
                    ADV
                </div>

                {/* External link indicator */}
                {isExternal && (
                    <div className="absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm shadow-sm bg-white/80 text-gray-600">
                        <ExternalLink size={14} />
                    </div>
                )}
            </div>

            {/* Content Section - EXACT same as free ads */}
            <div className={`p-3 ${viewMode === "list" ? "flex flex-col flex-1 justify-between p-4" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-medium text-text-main leading-tight group-hover:text-primary transition-colors ${viewMode === "list" ? "text-lg line-clamp-2" : "text-sm line-clamp-2"
                        }`}>
                        {ad.titulo}
                    </h3>
                </div>

                {viewMode === "list" && ad.descripcion && (
                    <p className="text-sm text-text-secondary line-clamp-2 mb-2 hidden md:block">
                        {ad.descripcion}
                    </p>
                )}

                {/* Bottom section - Same layout as free ads */}
                <div className="flex items-end justify-between mt-2">
                    <div className="flex flex-col">
                        <span className="text-xs text-text-secondary mb-0.5">Patrocinado</span>
                        <span className="text-lg font-bold text-primary">
                            Ver más →
                        </span>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary hover:text-primary -mr-2">
                        <ShoppingCart size={18} />
                    </Button>
                </div>
            </div>
        </>
    );

    // External link with redirect overlay
    if (isExternal) {
        return (
            <>
                <a
                    ref={cardRef}
                    href={isExternalNonVecivendo ? '#' : ad.link}
                    target={isExternalNonVecivendo ? undefined : "_blank"}
                    rel={isExternalNonVecivendo ? undefined : "noopener noreferrer sponsored"}
                    onClick={handleClick}
                    className={cardClasses}
                >
                    <CardContent />
                </a>

                {/* External redirect overlay */}
                <ExternalRedirectOverlay
                    url={ad.link}
                    isOpen={showRedirectOverlay}
                    onClose={() => setShowRedirectOverlay(false)}
                />
            </>
        );
    }

    // Internal link
    return (
        <Link
            ref={cardRef}
            href={ad.link || '#'}
            onClick={handleClick}
            className={cardClasses}
        >
            <CardContent />
        </Link>
    );
}

