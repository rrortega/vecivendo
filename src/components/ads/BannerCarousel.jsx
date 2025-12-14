"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ExternalLink, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ExternalRedirectOverlay from "./ExternalRedirectOverlay";

const ROTATION_INTERVAL = 15000; // 15 seconds
const VIEW_THRESHOLD_MS = 3000; // 3 seconds visibility required
const VIEW_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown per ad

/**
 * BannerCarousel - Displays and rotates banner-type paid ads
 * Features:
 * - Rotates banners every 15 seconds with smooth animation
 * - Tracks views only when visible for 3+ seconds
 * - Rate limits views to 1 per hour per ad per user (localStorage)
 * - Uses cached banners to avoid re-fetching
 * 
 * @param {Array} banners - Array of banner ad documents
 * @param {string} residentialSlug - Current residential slug
 */
export default function BannerCarousel({ banners = [], residentialSlug }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showInfoOverlay, setShowInfoOverlay] = useState(false);
    const [showRedirectOverlay, setShowRedirectOverlay] = useState(false);
    const [targetUrl, setTargetUrl] = useState('');

    const carouselRef = useRef(null);
    const visibilityTimerRef = useRef(null);
    const rotationTimerRef = useRef(null);
    const viewedAdsRef = useRef(new Set());

    // Get current banner
    const currentBanner = banners[currentIndex] || null;

    // Check if we can track a view (rate limited to 1 per hour)
    const canTrackView = useCallback((adId) => {
        if (!adId) return false;

        const storageKey = `banner_view_${adId}`;
        const lastView = localStorage.getItem(storageKey);

        if (lastView) {
            const elapsed = Date.now() - parseInt(lastView, 10);
            if (elapsed < VIEW_COOLDOWN_MS) {
                return false;
            }
        }

        return true;
    }, []);

    // Track a view
    const trackView = useCallback(async (adId) => {
        if (!adId || viewedAdsRef.current.has(adId)) return;
        if (!canTrackView(adId)) return;

        viewedAdsRef.current.add(adId);

        try {
            await fetch('/api/paid-ads/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adId, type: 'view' })
            });

            // Record in localStorage
            localStorage.setItem(`banner_view_${adId}`, Date.now().toString());
        } catch (error) {
            console.error('Error tracking banner view:', error);
        }
    }, [canTrackView]);

    // Track a click
    const trackClick = useCallback(async (adId) => {
        if (!adId) return;

        try {
            // Record in localStorage immediately to hide it on next render
            localStorage.setItem(`ad_clicked_${adId}`, Date.now().toString());

            await fetch('/api/paid-ads/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adId, type: 'click' })
            });
        } catch (error) {
            console.error('Error tracking banner click:', error);
        }
    }, []);

    // Handle visibility tracking
    useEffect(() => {
        if (!currentBanner?.$id) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const isVisible = entries[0].isIntersecting;

                if (isVisible) {
                    // Start visibility timer
                    visibilityTimerRef.current = setTimeout(() => {
                        trackView(currentBanner.$id);
                    }, VIEW_THRESHOLD_MS);
                } else {
                    // Clear visibility timer
                    if (visibilityTimerRef.current) {
                        clearTimeout(visibilityTimerRef.current);
                        visibilityTimerRef.current = null;
                    }
                }
            },
            { threshold: 0.5 }
        );

        if (carouselRef.current) {
            observer.observe(carouselRef.current);
        }

        return () => {
            observer.disconnect();
            if (visibilityTimerRef.current) {
                clearTimeout(visibilityTimerRef.current);
            }
        };
    }, [currentBanner?.$id, trackView]);

    // Auto-rotation
    // Rotation state
    const [isHovered, setIsHovered] = useState(false);
    const [isClickPaused, setIsClickPaused] = useState(false);
    const clickPauseTimerRef = useRef(null);

    // Auto-rotation
    useEffect(() => {
        if (banners.length <= 1) return;
        if (isHovered || isClickPaused) return;

        rotationTimerRef.current = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % banners.length);
                setIsTransitioning(false);
            }, 300);
        }, ROTATION_INTERVAL);

        return () => {
            if (rotationTimerRef.current) {
                clearInterval(rotationTimerRef.current);
            }
        };
    }, [banners.length, isHovered, isClickPaused]);

    // Handle interaction pause logic
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const handleClickPause = () => {
        setIsClickPaused(true);
        // Clear existing timer if any
        if (clickPauseTimerRef.current) clearTimeout(clickPauseTimerRef.current);

        // Resume after 20 seconds
        clickPauseTimerRef.current = setTimeout(() => {
            setIsClickPaused(false);
        }, 20000);
    };

    // Navigate to specific banner
    const goToSlide = (index) => {
        if (index === currentIndex) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex(index);
            setIsTransitioning(false);
        }, 300);

        // Reset rotation timer
        if (rotationTimerRef.current) {
            clearInterval(rotationTimerRef.current);
            rotationTimerRef.current = setInterval(() => {
                setIsTransitioning(true);
                setTimeout(() => {
                    setCurrentIndex(prev => (prev + 1) % banners.length);
                    setIsTransitioning(false);
                }, 300);
            }, ROTATION_INTERVAL);
        }
    };

    const goToPrevious = () => {
        const newIndex = currentIndex === 0 ? banners.length - 1 : currentIndex - 1;
        goToSlide(newIndex);
    };

    const goToNext = () => {
        const newIndex = (currentIndex + 1) % banners.length;
        goToSlide(newIndex);
    };

    // Handle click
    const handleClick = (e) => {
        if (!currentBanner) return;

        const isExternal = currentBanner.link?.startsWith('http');
        const isExternalNonVecivendo = isExternal && !currentBanner.link?.includes('vecivendo.com');

        trackClick(currentBanner.$id);

        if (isExternalNonVecivendo) {
            e.preventDefault();
            setTargetUrl(currentBanner.link);
            setShowInfoOverlay(false);
            setShowRedirectOverlay(true);
        }
    };

    // Mobile tap handler for info overlay
    const handleMobileTap = (e) => {
        if (window.matchMedia('(hover: none)').matches) {
            if (!showInfoOverlay) {
                e.preventDefault();
                setShowInfoOverlay(true);
            }
        }
    };

    if (!banners.length || !currentBanner) return null;

    const isExternal = currentBanner.link?.startsWith('http');
    const isExternalNonVecivendo = isExternal && !currentBanner.link?.includes('vecivendo.com');
    const imageUrl = currentBanner.image_url || currentBanner.imagen;

    return (
        <>
            <div
                ref={carouselRef}
                className="relative mx-4 my-4 rounded-2xl overflow-hidden shadow-lg group"
                onClick={(e) => {
                    handleMobileTap(e);
                    handleClickPause();
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Banner content */}
                <a
                    href={isExternalNonVecivendo ? '#' : (currentBanner.link || '#')}
                    target={isExternal && !isExternalNonVecivendo ? "_blank" : "_self"}
                    rel={isExternal && !isExternalNonVecivendo ? "noopener noreferrer sponsored" : ""}
                    onClick={handleClick}
                    className={`block relative h-32 md:h-40 overflow-hidden transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'
                        }`}
                >
                    {/* Background image */}
                    <div
                        className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110"
                        style={{
                            backgroundImage: imageUrl
                                ? `url(${imageUrl})`
                                : 'linear-gradient(135deg, var(--color-primary, #3b82f6), var(--color-primary-dark, #1d4ed8))',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

                    {/* Slide-up info overlay */}
                    <div
                        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent 
                            transition-all duration-300 ease-out flex flex-col justify-end p-4
                            ${showInfoOverlay ? 'h-full opacity-100' : 'h-0 opacity-0 md:group-hover:h-full md:group-hover:opacity-100'}`}
                    >
                        <div className={`transform transition-transform duration-300 ${showInfoOverlay ? 'translate-y-0' : 'translate-y-4 md:group-hover:translate-y-0'
                            }`}>
                            <h3 className="text-white font-bold text-lg md:text-xl mb-1 line-clamp-1">
                                {currentBanner.titulo}
                            </h3>
                            {currentBanner.descripcion && (
                                <p className="text-white/80 text-sm line-clamp-2 mb-3">
                                    {currentBanner.descripcion}
                                </p>
                            )}
                            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 font-semibold text-sm rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                                Visitar
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* ADV Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-md uppercase tracking-wider z-10">
                        Publicidad
                    </div>

                    {/* External link indicator */}
                    {isExternal && (
                        <div className="absolute top-3 right-12 p-1.5 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-sm z-10">
                            <ExternalLink size={14} className="text-gray-600 dark:text-gray-400" />
                        </div>
                    )}
                </a>

                {/* Navigation arrows (only if multiple banners) */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 dark:bg-gray-900/80 rounded-full shadow-md z-20 
                                opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                            aria-label="Anterior"
                        >
                            <ChevronLeft size={18} className="text-gray-700" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); goToNext(); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 dark:bg-gray-900/80 rounded-full shadow-md z-20 
                                opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                            aria-label="Siguiente"
                        >
                            <ChevronRight size={18} className="text-gray-700" />
                        </button>
                    </>
                )}

                {/* Dots indicator */}
                {banners.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {banners.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                                    ? 'bg-white w-4'
                                    : 'bg-white/50 hover:bg-white/80'
                                    }`}
                                aria-label={`Ir al banner ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Close info overlay button for mobile */}
                {showInfoOverlay && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowInfoOverlay(false); }}
                        className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white z-20 md:hidden"
                        aria-label="Cerrar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            {/* External redirect overlay */}
            <ExternalRedirectOverlay
                url={targetUrl}
                isOpen={showRedirectOverlay}
                onClose={() => setShowRedirectOverlay(false)}
            />
        </>
    );
}
