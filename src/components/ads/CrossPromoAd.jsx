"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink, ArrowRight, ImageOff } from "lucide-react";

/**
 * CrossPromoAd - Displays a cross-promotion ad inside ad detail pages
 * @param {Object} ad - The paid ad document
 * @param {string} residentialSlug - Current residential slug
 */
export default function CrossPromoAd({ ad, residentialSlug }) {
    const [hasTrackedView, setHasTrackedView] = useState(false);
    const adRef = useRef(null);

    // Check if view was already tracked in this session
    useEffect(() => {
        if (!ad?.$id) return;
        const viewedKey = `paid_ad_viewed_${ad.$id}`;
        if (sessionStorage.getItem(viewedKey)) {
            setHasTrackedView(true);
        }
    }, [ad?.$id]);

    // Track view when visible (only once per session)
    useEffect(() => {
        if (hasTrackedView || !ad?.$id) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    const viewedKey = `paid_ad_viewed_${ad.$id}`;
                    // Double-check sessionStorage in case of race conditions
                    if (!sessionStorage.getItem(viewedKey)) {
                        fetch('/api/paid-ads/track', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ adId: ad.$id, type: 'view' })
                        }).catch(console.error);

                        // Mark as viewed in sessionStorage
                        sessionStorage.setItem(viewedKey, 'true');
                    }
                    setHasTrackedView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        if (adRef.current) {
            observer.observe(adRef.current);
        }

        return () => observer.disconnect();
    }, [ad?.$id, hasTrackedView]);

    const handleClick = () => {
        fetch('/api/paid-ads/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adId: ad.$id, type: 'click' })
        }).catch(console.error);
    };

    if (!ad) return null;

    const isExternal = ad.link?.startsWith('http');
    const imageUrl = ad.image_url || ad.imagen;

    return (
        <div ref={adRef} className="my-6">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">
                    También te puede interesar
                </span>
                <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded uppercase">
                    Patrocinado
                </span>
            </div>

            <a
                href={ad.link || '#'}
                target={isExternal ? "_blank" : "_self"}
                rel={isExternal ? "noopener noreferrer sponsored" : ""}
                onClick={handleClick}
                className="group block bg-surface border border-border hover:border-primary/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
                <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="sm:w-48 md:w-56 aspect-video sm:aspect-square shrink-0 relative overflow-hidden bg-gray-100 dark:bg-white/5">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={ad.titulo}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <ImageOff size={32} className="text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                            <h4 className="text-lg font-semibold text-text-main group-hover:text-primary transition-colors mb-2 line-clamp-2">
                                {ad.titulo}
                            </h4>
                            {ad.descripcion && (
                                <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                                    {ad.descripcion}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-primary font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                Ver más
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            {isExternal && (
                                <ExternalLink size={14} className="text-text-secondary" />
                            )}
                        </div>
                    </div>
                </div>
            </a>
        </div>
    );
}
