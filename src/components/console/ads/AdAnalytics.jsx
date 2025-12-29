"use client";

import { useEffect, useState } from "react";
import { getAdAnalytics } from "@/lib/analytics";
import { Eye, ShoppingBag, Calendar, RefreshCw, Star, MessageSquare } from "lucide-react";
import TrafficAnalytics from "@/components/console/ads/TrafficAnalytics";

export default function AdAnalytics({ ad }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [advertiser, setAdvertiser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        if (ad?.$id) {
            loadStats();
            loadReviews();
        }
        if (ad?.celular_anunciante) {
            fetchAdvertiserInfo();
        }
    }, [ad]);

    const fetchAdvertiserInfo = async () => {
        try {
            const response = await fetch(`/api/users/lookup?phone=${encodeURIComponent(ad.celular_anunciante)}`);
            if (response.ok) {
                const data = await response.json();
                setAdvertiser(data);
            }
        } catch (error) {
            console.error("Error fetching advertiser info:", error);
        }
    };

    const loadReviews = async () => {
        try {
            const response = await fetch(`/api/ads/${ad.$id}/reviews?limit=50`);
            if (response.ok) {
                const data = await response.json();
                const fetchedReviews = data.documents || [];
                setReviews(fetchedReviews);

                if (fetchedReviews.length > 0) {
                    const total = fetchedReviews.reduce((acc, r) => acc + r.puntuacion, 0);
                    setAverageRating((total / fetchedReviews.length).toFixed(1));
                }
            }
        } catch (error) {
            console.error("Error loading reviews:", error);
        }
    };

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await getAdAnalytics(ad.$id);
            setStats(data);
        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Key Metrics Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="admin-surface p-4 rounded-xl border admin-border h-24">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                                <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
                            </div>
                            <div className="w-16 h-6 rounded bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                    ))}
                </div>

                {/* Traffic Breakdown Skeleton */}
                <div className="admin-surface p-6 rounded-xl border admin-border h-64">
                    <div className="flex justify-between items-center mb-6">
                        <div className="w-32 h-6 rounded bg-gray-200 dark:bg-gray-700"></div>
                        <div className="w-24 h-8 rounded bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    <div className="flex items-end justify-between h-32 gap-2 px-2">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="flex-1 rounded-t bg-gray-200 dark:bg-gray-700" style={{ height: `${Math.random() * 100}%` }}></div>
                        ))}
                    </div>
                </div>

                {/* Reviews Skeleton */}
                <div className="admin-surface p-6 rounded-xl border admin-border">
                    <div className="w-48 h-6 rounded bg-gray-200 dark:bg-gray-700 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border/50 h-32">
                                <div className="flex justify-between mb-3">
                                    <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="w-16 h-3 rounded bg-gray-200 dark:bg-gray-700"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-full h-3 rounded bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="w-3/4 h-3 rounded bg-gray-200 dark:bg-gray-700"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-border mx-auto max-w-lg">
                <p className="text-lg font-medium admin-text-muted">No hay estadísticas disponibles todavía</p>
                <p className="text-sm text-gray-400 mt-2">Vuelve a consultar más tarde cuando el anuncio haya recibido algunas visitas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="admin-surface p-4 rounded-xl border admin-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Eye size={20} />
                        </div>
                        <span className="text-sm admin-text-muted">Vistas Totales</span>
                    </div>
                    <p className="text-2xl font-bold admin-text">{stats.views}</p>
                </div>

                <div className="admin-surface p-4 rounded-xl border admin-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <ShoppingBag size={20} />
                        </div>
                        <span className="text-sm admin-text-muted">Pedidos</span>
                    </div>
                    <p className="text-2xl font-bold admin-text">0</p>
                    <p className="text-xs text-gray-400 mt-1">En desarrollo</p>
                </div>

                <div className="admin-surface p-4 rounded-xl border admin-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Calendar size={20} />
                        </div>
                        <span className="text-sm admin-text-muted">Publicado</span>
                    </div>
                    <p className="text-sm font-medium admin-text">
                        {new Date(ad.$createdAt).toLocaleDateString()}
                    </p>
                </div>

                <div className="admin-surface p-4 rounded-xl border admin-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                            <RefreshCw size={20} />
                        </div>
                        <span className="text-sm admin-text-muted">Actualizado</span>
                    </div>
                    <p className="text-sm font-medium admin-text">
                        {ad.$updatedAt !== ad.$createdAt ? "Sí" : "No"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date(ad.$updatedAt).toLocaleDateString()}
                    </p>
                </div>

                <div className="admin-surface p-4 rounded-xl border admin-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                            <Star size={20} className="fill-current" />
                        </div>
                        <span className="text-sm admin-text-muted">Rating</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold admin-text">{averageRating}</p>
                        <p className="text-xs text-gray-400 mb-1">({reviews.length})</p>
                    </div>
                </div>
            </div>

            {/* Traffic Breakdown */}
            <TrafficAnalytics stats={stats} />

            {/* Recent Reviews - Top 5 */}
            <div className="admin-surface p-6 rounded-xl border admin-border shadow-sm">
                <h3 className="text-lg font-semibold admin-text mb-4 flex items-center gap-2">
                    <MessageSquare size={20} className="text-primary" />
                    Reseñas Recientes
                </h3>
                {reviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reviews.slice(0, 5).map((review) => (
                            <div key={review.$id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium admin-text">{review.autor_nombre}</span>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={10}
                                                className={i < review.puntuacion ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-text-secondary line-clamp-3 italic">"{review.comentario}"</p>
                                <span className="text-[10px] text-gray-400 mt-2 block">
                                    {new Date(review.$createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center bg-gray/50 rounded-xl border border-dashed border-border px-4">
                        <p className="text-sm text-text-secondary italic">Aún no hay reseñas para este anuncio. Las calificaciones de tus vecinos aparecerán aquí.</p>
                    </div>
                )}
            </div>

            {/* Advertiser Info */}
            <div className="admin-surface p-6 rounded-xl border admin-border shadow-sm">
                <h3 className="text-lg font-semibold admin-text mb-4">Información del Anunciante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm admin-text-muted">Celular</p>
                        <p className="font-medium admin-text">{ad.celular_anunciante || "No registrado"}</p>
                    </div>
                    {advertiser && (
                        <>
                            <div>
                                <p className="text-sm admin-text-muted">Nombre</p>
                                <p className="font-medium admin-text">{advertiser.name}</p>
                            </div>
                            <div>
                                <p className="text-sm admin-text-muted">Email</p>
                                <p className="font-medium admin-text">{advertiser.email}</p>
                            </div>
                            <div>
                                <p className="text-sm admin-text-muted">Registro</p>
                                <p className="font-medium admin-text">{new Date(advertiser.registrationDate).toLocaleDateString()}</p>
                            </div>
                        </>
                    )}
                </div>
                {!advertiser && ad.celular_anunciante && (
                    <p className="text-xs text-gray-400 italic mt-4 border-t border-border pt-4">
                        Nota: No se encontró un perfil de usuario registrado vinculado a este número de celular.
                    </p>
                )}
            </div>
        </div>
    );
}
