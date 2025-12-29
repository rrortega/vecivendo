"use client";

import React, { useState, useEffect } from "react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { CommunityAlertBar } from "@/components/layout/CommunityAlertBar";
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";
import { useResidential } from "@/hooks/useResidential";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Clock, Package, Loader2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HistoryPage({ params }) {
    const { residencial } = params;
    const router = useRouter();
    const { residential: residentialData } = useResidential(residencial);
    const { userProfile } = useUserProfile();
    const residentialName = residentialData?.nombre || residencial;

    const [activeTab, setActiveTab] = useState("realizados");
    const [pedidosRealizados, setPedidosRealizados] = useState([]);
    const [pedidosRecibidos, setPedidosRecibidos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userProfile?.telefono) {
            fetchPedidos();
        } else if (userProfile && !userProfile.telefono) {
            // User loaded but has no phone, stop loading
            setIsLoading(false);
        }
    }, [userProfile]);

    const fetchPedidos = async () => {
        setIsLoading(true);
        try {
            const databases = new Databases(client);
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

            // Fetch pedidos realizados (como comprador) - using phone number
            if (userProfile.telefono) {
                const realizadosResponse = await databases.listDocuments(dbId, "pedidos", [
                    Query.equal("comprador_telefono", userProfile.telefono),
                    Query.orderDesc("$createdAt"),
                    Query.limit(100)
                ]);
                setPedidosRealizados(realizadosResponse.documents);

                // Fetch pedidos recibidos (como anunciante)
                const recibidosResponse = await databases.listDocuments(dbId, "pedidos", [
                    Query.equal("anunciante_telefono", userProfile.telefono),
                    Query.orderDesc("$createdAt"),
                    Query.limit(100)
                ]);
                setPedidosRecibidos(recibidosResponse.documents);
            }

        } catch (error) {
            console.error("Error fetching pedidos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'confirmado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'en_proceso': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'completado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'cancelado': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getEstadoLabel = (estado) => {
        switch (estado) {
            case 'pendiente': return 'Pendiente';
            case 'confirmado': return 'Confirmado';
            case 'en_proceso': return 'En Proceso';
            case 'completado': return 'Completado';
            case 'cancelado': return 'Cancelado';
            default: return estado;
        }
    };

    const renderPedidoCard = (pedido, isReceived = false) => {
        const items = JSON.parse(pedido.items || "[]");
        const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

        return (
            <div
                key={pedido.$id}
                onClick={() => router.push(`/${residencial}/pedido/${pedido.numero_pedido}`)}
                className="bg-surface rounded-xl border border-border p-4 hover:border-primary transition-colors cursor-pointer"
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Package size={16} className="text-primary" />
                            <span className="font-semibold text-text-main">{pedido.numero_pedido}</span>
                        </div>
                        <p className="text-sm text-text-secondary">
                            {new Date(pedido.$createdAt).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(pedido.estado)}`}>
                        {getEstadoLabel(pedido.estado)}
                    </span>
                </div>

                <div className="space-y-2 mb-3">
                    {isReceived ? (
                        <div className="text-sm">
                            <p className="text-text-secondary">Cliente:</p>
                            <p className="font-medium text-text-main">{pedido.comprador_nombre}</p>
                            <p className="text-xs text-text-secondary">{pedido.comprador_telefono}</p>
                        </div>
                    ) : (
                        <div className="text-sm">
                            <p className="text-text-secondary">Dirección de entrega:</p>
                            <p className="font-medium text-text-main">{pedido.direccion_entrega}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="text-sm text-text-secondary">
                        {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-text-main">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(pedido.total)}
                        </span>
                        <ChevronRight size={20} className="text-text-secondary" />
                    </div>
                </div>
            </div>
        );
    };

    const showTabs = pedidosRecibidos.length > 0;
    const currentPedidos = activeTab === "realizados" ? pedidosRealizados : pedidosRecibidos;

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0 transition-all duration-300" style={{ paddingTop: 'var(--alert-bar-height, 0px)' }}>
            <CommunityAlertBar residentialSlug={residencial} />
            <HomeHeader residencialName={residentialName} residentialSlug={residencial} showFilters={false} />

            <div className="max-w-7xl mx-auto pt-10 md:pt-20 px-4 md:px-6">
                <div className="flex items-center gap-3 mb-8">
                    <Clock className="text-primary" size={32} />
                    <h1 className="text-3xl font-bold text-text-main">Historial de Pedidos</h1>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-surface rounded-xl border border-border p-4 animate-pulse">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="h-5 bg-border rounded w-32 mb-2"></div>
                                        <div className="h-4 bg-border rounded w-48"></div>
                                    </div>
                                    <div className="h-6 bg-border rounded-full w-20"></div>
                                </div>
                                <div className="space-y-2 mb-3">
                                    <div className="h-3 bg-border rounded w-20"></div>
                                    <div className="h-4 bg-border rounded w-full"></div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                    <div className="h-4 bg-border rounded w-24"></div>
                                    <div className="h-6 bg-border rounded w-20"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Tabs - Only show if there are received orders */}
                        {showTabs && (
                            <div className="flex gap-2 mb-6 border-b border-border">
                                <button
                                    onClick={() => setActiveTab("realizados")}
                                    className={`px-6 py-3 font-medium transition-colors relative ${activeTab === "realizados"
                                        ? "text-primary"
                                        : "text-text-secondary hover:text-text-main"
                                        }`}
                                >
                                    Pedidos Realizados
                                    {activeTab === "realizados" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                    )}
                                    {pedidosRealizados.length > 0 && (
                                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            {pedidosRealizados.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab("recibidos")}
                                    className={`px-6 py-3 font-medium transition-colors relative ${activeTab === "recibidos"
                                        ? "text-primary"
                                        : "text-text-secondary hover:text-text-main"
                                        }`}
                                >
                                    Pedidos Recibidos
                                    {activeTab === "recibidos" && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                    )}
                                    {pedidosRecibidos.length > 0 && (
                                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            {pedidosRecibidos.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Orders List */}
                        {currentPedidos.length === 0 ? (
                            <div className="text-center py-20">
                                <Package className="mx-auto text-text-secondary/30 mb-4" size={64} />
                                <p className="text-text-secondary text-lg">
                                    {showTabs
                                        ? activeTab === "realizados"
                                            ? "No has realizado pedidos"
                                            : "No has recibido pedidos"
                                        : `No tienes pedidos en ${residentialName}`
                                    }
                                </p>
                                <p className="text-text-secondary/70 text-sm mt-2">
                                    {showTabs
                                        ? activeTab === "realizados"
                                            ? "Los pedidos que realices aparecerán aquí"
                                            : "Los pedidos de tus anuncios aparecerán aquí"
                                        : "Tus pedidos realizados en este residencial aparecerán aquí"
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {currentPedidos.map(pedido => renderPedidoCard(pedido, activeTab === "recibidos"))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
