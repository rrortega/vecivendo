"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { ChevronLeft, BarChart2, Edit } from "lucide-react";

// Placeholder components - in a real scenario these would be separate files
const PaidAdAnalytics = ({ ad }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="admin-surface p-6 rounded-xl border admin-border">
            <h3 className="admin-text-muted text-sm font-medium">Vistas Totales</h3>
            <p className="text-3xl font-bold admin-text mt-2">{ad.vistas || 0}</p>
        </div>
        <div className="admin-surface p-6 rounded-xl border admin-border">
            <h3 className="admin-text-muted text-sm font-medium">Clicks Totales</h3>
            <p className="text-3xl font-bold admin-text mt-2">{ad.clicks || 0}</p>
        </div>
        <div className="admin-surface p-6 rounded-xl border admin-border">
            <h3 className="admin-text-muted text-sm font-medium">CTR (Click Through Rate)</h3>
            <p className="text-3xl font-bold admin-text mt-2">
                {ad.vistas ? ((ad.clicks / ad.vistas) * 100).toFixed(2) : 0}%
            </p>
        </div>
        {/* Here you would add charts using Recharts or similar */}
        <div className="col-span-1 md:col-span-3 admin-surface p-6 rounded-xl border admin-border h-64 flex items-center justify-center text-gray-400">
            Gráfico de rendimiento (Próximamente)
        </div>
    </div>
);

const PaidAdEditForm = ({ ad }) => (
    <div className="admin-surface p-6 rounded-xl border admin-border">
        <h3 className="text-lg font-medium admin-text mb-4">Editar Información</h3>
        <p className="text-gray-500">Formulario de edición para {ad.titulo} (Próximamente)</p>
    </div>
);

export default function PaidAdDetailsPage({ params }) {
    const { id } = params;
    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("analytics");
    const { showToast } = useToast();
    const router = useRouter();

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "publicidad";

    useEffect(() => {
        fetchAd();
    }, [id]);

    const fetchAd = async () => {
        try {
            setLoading(true);
            const response = await databases.getDocument(dbId, collectionId, id);
            setAd(response);
        } catch (error) {
            console.error("Error fetching paid ad:", error);
            showToast("Error al cargar el anuncio", "error");
            router.push("/console/ads");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!ad) return null;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/console/ads")}
                        className="p-2 rounded-lg admin-hover admin-text-muted transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold admin-text flex items-center gap-2">
                            {ad.titulo}
                            <span className={`px-2 py-0.5 text-xs rounded-full ${ad.active ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                                {ad.active ? "Activo" : "Inactivo"}
                            </span>
                        </h1>
                        <p className="admin-text-muted mt-1">
                            Cliente: {ad.cliente || "N/A"} • ID: {ad.$id}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b admin-border">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab("analytics")}
                        className={`pb-4 flex items-center gap-2 font-medium text-sm transition-colors relative ${activeTab === "analytics"
                            ? "text-primary-600 dark:text-primary-400"
                            : "admin-text-muted hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <BarChart2 size={18} />
                        Métricas
                        {activeTab === "analytics" && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-400 rounded-t-full" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab("edit")}
                        className={`pb-4 flex items-center gap-2 font-medium text-sm transition-colors relative ${activeTab === "edit"
                            ? "text-primary-600 dark:text-primary-400"
                            : "admin-text-muted hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <Edit size={18} />
                        Editar
                        {activeTab === "edit" && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-400 rounded-t-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === "analytics" ? (
                    <PaidAdAnalytics ad={ad} />
                ) : (
                    <PaidAdEditForm ad={ad} />
                )}
            </div>
        </div>
    );
}
