"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";

export const PromoBanner = ({ residentialSlug }) => {
    const [ads, setAds] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = React.useRef(null);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
                let targetId = null;

                // Resolve slug to ID if provided
                if (residentialSlug) {
                    const resDocs = await databases.listDocuments(
                        dbId,
                        "residenciales",
                        [Query.equal("slug", residentialSlug)]
                    );
                    if (resDocs.documents.length > 0) {
                        targetId = resDocs.documents[0].$id;
                    }
                }

                // Build query
                const queries = [
                    Query.limit(5),
                    Query.orderDesc("fecha_inicio")
                ];

                if (targetId) {
                    // User confirmed it's a many-to-many relationship named 'residenciales'
                    queries.push(Query.equal("residenciales", targetId));
                }

                try {
                    const response = await databases.listDocuments(
                        dbId,
                        "anuncios_pago",
                        queries
                    );
                    setAds(response.documents);
                } catch (queryError) {
                    // Fallback if attribute doesn't exist or other query error
                    console.warn("Error filtering ads (likely schema mismatch), fetching all:", queryError);
                    const fallbackResponse = await databases.listDocuments(
                        dbId,
                        "anuncios_pago",
                        [
                            Query.limit(5),
                            Query.orderDesc("fecha_inicio")
                        ]
                    );
                    setAds(fallbackResponse.documents);
                }
            } catch (error) {
                console.error("Error fetching promo ads:", error);
            }
        };

        fetchAds();
    }, [residentialSlug]);

    // Auto-scroll effect
    useEffect(() => {
        if (ads.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => {
                const next = (prev + 1) % ads.length;
                if (scrollRef.current) {
                    const scrollAmount = scrollRef.current.clientWidth * next;
                    scrollRef.current.scrollTo({
                        left: scrollAmount,
                        behavior: 'smooth'
                    });
                }
                return next;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [ads.length]);

    // Handle manual scroll to update index
    const handleScroll = () => {
        if (scrollRef.current) {
            const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
            setCurrentIndex(index);
        }
    };

    if (ads.length === 0) return null;

    return (
        <div className="relative mx-4 mt-4 mb-6 group rounded-3xl shadow-lg overflow-hidden pb-1">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full"
                style={{ scrollBehavior: 'smooth' }}
            >
                {ads.map((ad) => (
                    <div
                        key={ad.$id}
                        className="min-w-full relative overflow-hidden bg-gradient-to-r from-[#2ecc71] to-[#27ae60] p-6 text-white snap-center"
                    >
                        <div className="relative z-10 max-w-[60%] flex flex-col items-start h-full justify-center min-h-[140px]">
                            <h2 className="text-2xl font-bold mb-3 leading-tight">{ad.titulo}</h2>
                            {ad.link_destino && (
                                ad.link_destino.startsWith('http') ? (
                                    <a href={ad.link_destino} target="_blank" rel="noopener noreferrer">
                                        <Button
                                            size="sm"
                                            className="bg-surface text-text-main border border-transparent hover:border-primary dark:bg-black/20 dark:text-white transition-colors font-semibold"
                                        >
                                            Ver Oferta
                                        </Button>
                                    </a>
                                ) : (
                                    <Link href={ad.link_destino}>
                                        <Button
                                            size="sm"
                                            className="bg-surface text-text-main border border-transparent hover:border-primary dark:bg-black/20 dark:text-white transition-colors font-semibold"
                                        >
                                            Ver Oferta
                                        </Button>
                                    </Link>
                                )
                            )}
                        </div>

                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 h-full w-1/2 opacity-20 bg-white rounded-l-full transform translate-x-1/4 pointer-events-none" />

                        {ad.imagen_url && (
                            <img
                                src={ad.imagen_url}
                                alt={ad.titulo}
                                className="absolute bottom-0 right-0 h-full w-1/2 object-contain object-bottom opacity-90 pointer-events-none"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination Dots */}
            {ads.length > 1 && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20">
                    {ads.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${currentIndex === idx ? "bg-white w-4" : "bg-white/50"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
