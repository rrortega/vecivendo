"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/context/ToastContext";
import { Search, Filter, Calendar, Building2, Tag, ImageOff, ChevronLeft, ChevronRight, Eye, MousePointer } from "lucide-react";
import { useRouter } from "next/navigation";

import AddButton from "@/components/console/AddButton";

export default function PaidAdsPage() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const router = useRouter();

    const [filters, setFilters] = useState({
        search: "",
        status: "all", // all, active, inactive
        date: "",
    });

    const { showToast } = useToast();
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "publicidad"; // Assuming this is the collection name

    useEffect(() => {
        fetchAds();
    }, [page, filters]);

    const fetchAds = async () => {
        setLoading(true);
        try {
            const queries = [
                Query.orderDesc("$createdAt"),
                Query.limit(limit),
                Query.offset((page - 1) * limit)
            ];

            if (filters.search) {
                queries.push(Query.search("titulo", filters.search));
            }

            if (filters.status !== "all") {
                queries.push(Query.equal("active", filters.status === "active"));
            }

            if (filters.date) {
                const startOfDay = new Date(filters.date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filters.date);
                endOfDay.setHours(23, 59, 59, 999);
                queries.push(Query.between("$createdAt", startOfDay.toISOString(), endOfDay.toISOString()));
            }

            const response = await databases.listDocuments(dbId, collectionId, queries);
            setAds(response.documents);
            setTotal(response.total);
        } catch (error) {
            console.error("Error fetching paid ads:", error);
            // showToast("Error al cargar publicidad", "error"); // Suppress error if collection doesn't exist yet
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const handleToggleStatus = async (e, ad) => {
        e.stopPropagation();
        try {
            await databases.updateDocument(dbId, collectionId, ad.$id, {
                active: !ad.active
            });
            setAds(prev => prev.map(a => a.$id === ad.$id ? { ...a, active: !a.active } : a));
            showToast(`Anuncio ${!ad.active ? 'activado' : 'desactivado'}`, "success");
        } catch (error) {
            console.error("Error toggling status:", error);
            showToast("Error al cambiar estado", "error");
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold admin-text">Publicidad</h1>
                    <p className="admin-text-muted mt-1">Gestiona los anuncios de pago y campañas</p>
                </div>
                <AddButton href="/console/ads/create" label="Nueva Publicidad" />
            </div>

            {/* Filters */}
            <div className="admin-surface p-4 rounded-xl shadow-sm border admin-border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por título..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange("status", e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="active">Activos</option>
                            <option value="inactive">Inactivos</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => handleFilterChange("date", e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Table View */}
            <div className="admin-surface rounded-xl border admin-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="admin-bg/50 admin-text-muted font-medium border-b admin-border">
                            <tr>
                                <th className="px-4 py-3 w-16">Imagen</th>
                                <th className="px-4 py-3">Título</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                                <th className="px-4 py-3 text-center">Vistas</th>
                                <th className="px-4 py-3 text-center">Clicks</th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y admin-border">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-3"><div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></td>
                                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></td>
                                        <td className="px-4 py-3"><div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : ads.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-4 py-12 text-center admin-text-muted">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="text-gray-300 dark:text-gray-600 mb-2" size={32} />
                                            <p>No se encontraron anuncios de publicidad</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                ads.map((ad) => (
                                    <tr
                                        key={ad.$id}
                                        className="admin-hover transition-colors group cursor-pointer"
                                        onClick={() => router.push(`/console/ads/${ad.$id}`)}
                                    >
                                        <td className="px-4 py-2">
                                            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-900 border admin-border flex-shrink-0">
                                                {ad.imagen ? (
                                                    <img
                                                        src={ad.imagen}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <ImageOff size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 font-medium admin-text">
                                            <div className="line-clamp-1 max-w-[200px]" title={ad.titulo}>
                                                {ad.titulo}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">
                                            {ad.cliente || "N/A"}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button
                                                onClick={(e) => handleToggleStatus(e, ad)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${ad.active ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                                            >
                                                <span
                                                    className={`${ad.active ? 'translate-x-4' : 'translate-x-1'} inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-4 py-2 text-center admin-text-muted">
                                            <div className="flex items-center justify-center gap-1">
                                                <Eye size={14} />
                                                {ad.vistas || 0}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center admin-text-muted">
                                            <div className="flex items-center justify-center gap-1">
                                                <MousePointer size={14} />
                                                {ad.clicks || 0}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 admin-text-muted whitespace-nowrap text-xs">
                                            {new Date(ad.$createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <button
                                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                title="Ver detalles"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {total > limit && (
                <div className="flex items-center justify-between mt-8 border-t admin-border pt-4">
                    <p className="text-sm admin-text-muted">
                        Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, total)} de {total} resultados
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border admin-border hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium admin-text">
                            Página {page} de {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg border admin-border hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
