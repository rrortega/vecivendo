"use client";

import { useEffect, useState } from "react";
// import { databases } from "@/lib/appwrite"; // Removed unused import
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { Save, Trash2, AlertTriangle, FileText, Image, Package, ChevronLeft, BarChart2, Edit, ExternalLink } from "lucide-react";

import Link from "next/link";
import AdAnalytics from "@/components/console/ads/AdAnalytics";
import AdEditForm from "@/components/console/ads/AdEditForm";
import ErrorBoundary from "@/components/ErrorBoundary";
import { logAdView } from "@/lib/analytics";


export default function AdDetailsPage({ params }) {
    const { id } = params;
    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("analytics");
    const { showToast } = useToast();
    const router = useRouter();

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "anuncios";

    useEffect(() => {
        fetchAd();
        // Log view when page loads
        logAdView(id);
    }, [id]);

    const fetchAd = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/ads/${id}`);
            if (!response.ok) {
                throw new Error('Error al cargar el anuncio');
            }
            const data = await response.json();
            setAd(data);
        } catch (error) {
            console.error("Error fetching ad:", error);
            showToast("Error al cargar el anuncio", "error");
            router.push("/console/free-ads");
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
                        onClick={() => router.push("/console/free-ads")}
                        className="p-2 rounded-lg admin-hover admin-text-muted transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold admin-text flex items-center gap-2">
                            {ad.titulo}
                            <span className={`px-2 py-0.5 text-xs rounded-full ${ad.activo ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                                {ad.activo ? "Activo" : "Inactivo"}
                            </span>
                        </h1>
                        <p className="admin-text-muted mt-1 flex items-center gap-2">
                            ID: {ad.$id}
                            {/* Link to public page if we know the residential slug */}
                            {/* We might need to fetch residential to get slug, or just link generically if possible */}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {/* Placeholder for 'View Public Ad' if we can construct the URL */}
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
                        Analítica
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
                        Editar Anuncio
                        {activeTab === "edit" && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-400 rounded-t-full" />
                        )}
                    </button>
                </div>
            </div>



            {/* Content */}
            <ErrorBoundary>
                <div className="animate-in fade-in duration-300">
                    {activeTab === "analytics" ? (
                        <AdAnalytics ad={ad} />
                    ) : (
                        <AdEditForm ad={ad} />


                    )}
                </div>
            </ErrorBoundary>






        </div>
    );
}
