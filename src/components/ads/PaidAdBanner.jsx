"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink, ArrowRight } from "lucide-react";
import ExternalRedirectOverlay from "./ExternalRedirectOverlay";

/**
 * PaidAdBanner - Displays a banner-type paid ad
 * @param {Object} ad - The paid ad document
 * @param {string} residentialSlug - Current residential slug for links
 */
export default function PaidAdBanner({ ad, residentialSlug }) {
    const [hasTrackedView, setHasTrackedView] = useState(false);
    const [showInfoOverlay, setShowInfoOverlay] = useState(false);
    const [showRedirectOverlay, setShowRedirectOverlay] = useState(false);
    const bannerRef = useRef(null);

    // Check if view was already tracked in this session
    useEffect(() => {
        if (!ad?.$id) return;
        const viewedKey = `paid_ad_viewed_${ad.$id}`;
        if (sessionStorage.getItem(viewedKey)) {
            setHasTrackedView(true);
        }
    }, [ad?.$id]);

    // Track view when banner becomes visible (only once per session)
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
                            body: JSON.stringify({ adId: ad.$id, type: 'view' })
                        }).catch(console.error);
                        sessionStorage.setItem(viewedKey, 'true');
                    }
                    setHasTrackedView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        if (bannerRef.current) {
            observer.observe(bannerRef.current);
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
            body: JSON.stringify({ adId: ad.$id, type: 'click' })
        }).catch(console.error);

        // If external non-vecivendo link, show redirect overlay
        if (isExternalNonVecivendo) {
            e.preventDefault();
            setShowInfoOverlay(false);
            setShowRedirectOverlay(true);
        }
    };

    // Mobile: toggle info overlay on tap
    const handleMobileClick = (e) => {
        // Check if we're on mobile (no hover support)
        if (window.matchMedia('(hover: none)').matches) {
            if (!showInfoOverlay) {
                e.preventDefault();
                setShowInfoOverlay(true);
            }
            // If overlay is shown, let the click go through to handleClick
        }
    };

    return (
        <>
            <div
                ref={bannerRef}
                className="relative mx-4 my-4 rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                onClick={handleMobileClick}
            >
                <a
                    href={isExternalNonVecivendo ? '#' : (ad.link || '#')}
                    target={isExternal && !isExternalNonVecivendo ? "_blank" : "_self"}
                    rel={isExternal && !isExternalNonVecivendo ? "noopener noreferrer sponsored" : ""}
                    onClick={handleClick}
                    className="block relative h-32 md:h-40 overflow-hidden"
                >
                    {/* Background image with cover */}
                    <div
                        className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110"
                        style={{
                            backgroundImage: imageUrl
                                ? `url(${imageUrl})`
                                : 'linear-gradient(135deg, var(--color-primary, #3b82f6), var(--color-primary-dark, #1d4ed8))',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    />

                    {/* Base gradient overlay for badge visibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

                    {/* Slide-up info overlay - Desktop: on hover, Mobile: on click */}
                    <div
                        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent 
                            transition-all duration-300 ease-out flex flex-col justify-end p-4
                            ${showInfoOverlay ? 'h-full opacity-100' : 'h-0 opacity-0 md:group-hover:h-full md:group-hover:opacity-100'}`}
                    >
                        <div className={`transform transition-transform duration-300 ${showInfoOverlay ? 'translate-y-0' : 'translate-y-4 md:group-hover:translate-y-0'}`}>
                            <h3 className="text-white font-bold text-lg md:text-xl mb-1 line-clamp-1">
                                {ad.titulo}
                            </h3>
                            {ad.descripcion && (
                                <p className="text-white/80 text-sm line-clamp-2 mb-3">
                                    {ad.descripcion}
                                </p>
                            )}
                            <button
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 font-semibold text-sm rounded-lg 
                                    hover:bg-gray-100 transition-colors shadow-lg"
                            >
                                Visitar
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* ADV Badge - always visible */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-md uppercase tracking-wider z-10">
                        Publicidad
                    </div>

                    {/* External link indicator */}
                    {isExternal && (
                        <div className="absolute top-3 right-3 p-1.5 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-sm z-10">
                            <ExternalLink size={14} className="text-gray-600 dark:text-gray-400" />
                        </div>
                    )}
                </a>

                {/* Close info overlay button for mobile */}
                {showInfoOverlay && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowInfoOverlay(false); }}
                        className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white z-20 md:hidden"
                        aria-label="Cerrar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                )}
            </div>

            {/* External redirect overlay */}
            <ExternalRedirectOverlay
                url={ad.link}
                isOpen={showRedirectOverlay}
                onClose={() => setShowRedirectOverlay(false)}
            />
        </>
    );
}
