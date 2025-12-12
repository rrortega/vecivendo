"use client";

import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const ReviewsSection = ({ adId, onModalOpenChange }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (onModalOpenChange) {
            onModalOpenChange(isModalOpen);
        }
    }, [isModalOpen, onModalOpenChange]);

    const handleCloseModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsClosing(false);
        }, 300); // Match animation duration
    };

    useEffect(() => {
        const fetchReviews = async () => {
            if (!adId) return;

            try {
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                // Fetch all reviews to calculate average and have them ready for modal
                // In a real large app, we might want to paginate, but for now fetching all is fine or fetching 3 and then more.
                // Let's fetch a reasonable limit like 50.
                const response = await databases.listDocuments(
                    dbId,
                    "reviews",
                    [
                        Query.equal("anuncio_id", adId),
                        Query.orderDesc("$createdAt"),
                        Query.limit(50)
                    ]
                );

                setReviews(response.documents);

                // Calculate average
                if (response.documents.length > 0) {
                    const total = response.documents.reduce((acc, review) => acc + review.puntuacion, 0);
                    setAverageRating((total / response.documents.length).toFixed(1));
                }
            } catch (error) {
                console.error("Error fetching reviews:", error);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [adId]);

    if (loading) return <div className="py-4 text-center text-sm text-text-secondary">Cargando reseñas...</div>;

    if (reviews.length === 0) {
        return (
            <div className="py-6 border-t border-border">
                <h3 className="text-lg font-bold text-text-main mb-2">Reseñas del Anuncio</h3>
                <p className="text-sm text-text-secondary">Este anuncio aún no tiene reseñas.</p>
            </div>
        );
    }

    const displayedReviews = reviews.slice(0, 3);

    return (
        <div className="py-6 border-t border-border animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-text-main">Reseñas del Anuncio</h3>
                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                    <Star className="fill-yellow-400 text-yellow-400" size={16} />
                    <span className="font-bold text-yellow-700">{averageRating}</span>
                    <span className="text-xs text-yellow-600">({reviews.length})</span>
                </div>
            </div>

            <div className="space-y-4 mb-4">
                {displayedReviews.map((review) => (
                    <ReviewCard key={review.$id} review={review} />
                ))}
            </div>

            {reviews.length > 3 && (
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsModalOpen(true)}
                >
                    Ver todas las reseñas ({reviews.length})
                </Button>
            )}

            {/* Reviews Modal */}
            {(isModalOpen || isClosing) && (
                <div
                    className={`fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                    onClick={handleCloseModal}
                >
                    <div
                        className={`bg-surface w-full md:max-w-2xl h-full md:h-[90vh] md:rounded-3xl shadow-xl border-t md:border border-border flex flex-col ${isClosing ? 'animate-slideOutDown' : 'animate-slideInUp'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 md:p-6 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10 md:rounded-t-3xl">
                            <h3 className="text-xl font-bold text-text-main">Todas las reseñas</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCloseModal}
                                className="text-text-main hover:text-text-main"
                            >
                                <X size={24} />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                            {reviews.map((review) => (
                                <ReviewCard key={review.$id} review={review} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReviewCard = ({ review }) => (
    <div className="bg-surface p-4 rounded-xl border border-border">
        <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-text-main">{review.autor_nombre}</span>
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={12}
                        className={i < review.puntuacion ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                    />
                ))}
            </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{review.comentario}</p>
        <span className="text-xs text-gray-400 mt-2 block">
            {new Date(review.$createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
    </div>
);
