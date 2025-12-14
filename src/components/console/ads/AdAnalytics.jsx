"use client";

import { useEffect, useState } from "react";
import { getAdAnalytics } from "@/lib/analytics";
import { Eye, ShoppingBag, Calendar, RefreshCw } from "lucide-react";
import TrafficAnalytics from "@/components/console/ads/TrafficAnalytics";

export default function AdAnalytics({ ad }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [advertiser, setAdvertiser] = useState(null);

    useEffect(() => {
        if (ad?.$id) {
            loadStats();
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
        return <div className="p-8 text-center text-gray-500">Cargando analíticas...</div>;
    }

    if (!stats) {
        return <div className="p-8 text-center text-gray-500">No hay datos disponibles</div>;
    }

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <p className="text-xs text-gray-400 mt-1">Funcionalidad en desarrollo</p>
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
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date(ad.$createdAt).toLocaleTimeString()}
                    </p>
                </div>

                <div className="admin-surface p-4 rounded-xl border admin-border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                            <RefreshCw size={20} />
                        </div>
                        <span className="text-sm admin-text-muted">Actualizaciones</span>
                    </div>
                    <p className="text-2xl font-bold admin-text">
                        {/* Mocking update count based on updated vs created diff if needed, or just 1 */}
                        {ad.$updatedAt !== ad.$createdAt ? "Si" : "No"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Última: {new Date(ad.$updatedAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Traffic Breakdown */}
            <TrafficAnalytics stats={stats} />

            {/* Advertiser Info */}
            <div className="admin-surface p-6 rounded-xl border admin-border shadow-sm">
                <h3 className="text-lg font-semibold admin-text mb-4">Información del Anunciante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm admin-text-muted">Celular</p>
                        <p className="font-medium admin-text">{ad.celular_anunciante || "No registrado"}</p>
                    </div>
                    {advertiser ? (
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
                    ) : (
                        <div className="col-span-2">
                            <p className="text-sm text-gray-400 italic">
                                {ad.celular_anunciante
                                    ? "No se encontró usuario registrado con este número"
                                    : "Agregue un número de celular para ver detalles del anunciante"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
