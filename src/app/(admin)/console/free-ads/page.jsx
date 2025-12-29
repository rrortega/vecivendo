"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { Search, Filter, Calendar, Building2, Tag, ImageOff, ChevronLeft, ChevronRight, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import AddButton from "@/components/console/AddButton";
import ConfirmModal from "@/components/console/ConfirmModal";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
const residentialsCollectionId = "residenciales";

export default function AdsPage() {
    const [ads, setAds] = useState([]);
    const [allAds, setAllAds] = useState([]); // Guardar todos los anuncios sin filtrar por vigencia
    const [residentials, setResidentials] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(24); // Personalizable
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
    const router = useRouter();

    const [filters, setFilters] = useState({
        search: "",
        category: "",
        residential: "",
        date: "", // YYYY-MM-DD
        vigencia: "all", // all, expired, 6days, 5days, 4days, 3days, 24hours
    });

    const [sortConfig, setSortConfig] = useState({
        key: '$createdAt',
        direction: 'desc'
    });

    const { showToast } = useToast();

    useEffect(() => {
        fetchResidentials();
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchAds();
        setSelectedIds([]); // Limpiar selección al cambiar de página o filtros
    }, [page, filters.search, filters.category, filters.residential, filters.date, limit, sortConfig]);

    // Filtrar por vigencia en el frontend (después de obtener resultados)
    useEffect(() => {
        if (!filters.vigencia || filters.vigencia === 'all') {
            setAds(allAds);
            return;
        }

        const filtered = allAds.filter(ad => {
            const expStatus = getExpirationStatus(ad);

            switch (filters.vigencia) {
                case 'expired':
                    return expStatus.daysLeft <= 0;
                case '6days':
                    return expStatus.daysLeft === 6;
                case '5days':
                    return expStatus.daysLeft === 5;
                case '4days':
                    return expStatus.daysLeft === 4;
                case '3days':
                    return expStatus.daysLeft === 3;
                case '24hours':
                    return expStatus.daysLeft <= 1 && expStatus.daysLeft > 0;
                default:
                    return true;
            }
        });

        setAds(filtered);
    }, [filters.vigencia, allAds]);

    const fetchResidentials = async () => {
        try {
            const response = await databases.listDocuments(dbId, residentialsCollectionId, [
                Query.limit(100)
            ]);
            setResidentials(response.documents);
        } catch (error) {
            console.error("Error fetching residentials:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            if (!response.ok) {
                throw new Error('Error al obtener categorías');
            }
            const data = await response.json();
            setCategories(data.documents || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchAds = async () => {
        setLoading(true);
        try {
            // Construir parámetros de query
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sort: sortConfig.key,
                order: sortConfig.direction
            });

            if (filters.search) {
                params.append('search', filters.search);
            }

            if (filters.category) {
                params.append('categoria', filters.category);
            }

            if (filters.residential) {
                params.append('residencial', filters.residential);
            }

            if (filters.date) {
                params.append('date', filters.date);
            }

            console.log('📋 [Cliente] Obteniendo anuncios desde API:', `/api/ads?${params}`);

            const response = await fetch(`/api/ads?${params}`);

            if (!response.ok) {
                throw new Error('Error al obtener anuncios');
            }

            const data = await response.json();

            console.log(`✅ [Cliente] Obtenidos ${data.documents.length} anuncios`);

            setAds(data.documents);
            setAllAds(data.documents); // Guardar copia para filtro de vigencia
            if (data.documents.length > 0) {
                console.log("First ad residential:", data.documents[0].residencial);
            }
            setTotal(data.total);
        } catch (error) {
            console.error("❌ [Cliente] Error fetching ads:", error);
            showToast("Error al cargar anuncios", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset to first page on filter change
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const getResidentialName = (ad) => {
        if (ad.residencial && ad.residencial.nombre) {
            return ad.residencial.nombre;
        }
        if (ad.residencial && typeof ad.residencial === 'string') {
            const res = residentials.find(r => r.$id === ad.residencial);
            return res ? res.nombre : "Desconocido";
        }
        return "Sin residencial";
    };

    const getExpirationStatus = (ad) => {
        const updatedAt = ad.$updatedAt ? new Date(ad.$updatedAt) : null;
        if (!updatedAt) return { status: 'unknown', daysLeft: 0, text: 'Desconocido' };

        const expirationDays = 6;
        const expirationDate = new Date(updatedAt.getTime() + expirationDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        const timeRemaining = expirationDate - now;
        const daysLeft = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
            return { status: 'expired', daysLeft: 0, text: 'Caducado' };
        } else if (daysLeft <= 2) {
            return { status: 'warning', daysLeft, text: `${daysLeft} día${daysLeft > 1 ? 's' : ''}` };
        } else {
            return { status: 'active', daysLeft, text: `${daysLeft} días` };
        }
    };

    // Funciones de selección
    const handleSelectAll = () => {
        if (selectedIds.length === ads.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(ads.map(ad => ad.$id));
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleLimitChange = (newLimit) => {
        setLimit(newLimit);
        setPage(1); // Reset a primera página
    };

    const handleBatchDelete = async () => {
        console.log('🗑️ [Cliente] Iniciando eliminación batch de', selectedIds.length, 'anuncios');
        console.log('📋 [Cliente] IDs a eliminar:', selectedIds);
        setLoading(true);
        setShowBatchDeleteModal(false);

        try {
            const response = await fetch('/api/ads/batch-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (!response.ok) {
                throw new Error('Error en eliminación batch');
            }

            const data = await response.json();

            console.log(`📊 [Cliente] Resultados: ${data.successful} exitosos, ${data.failed} fallidos`);

            if (data.failed > 0) {
                console.error('❌ [Cliente] Algunos anuncios fallaron:', data.results.filter(r => !r.success));
                showToast(`${data.successful} anuncio(s) eliminado(s), ${data.failed} fallaron`, "warning");
            } else {
                console.log('✅ [Cliente] Todos los anuncios eliminados exitosamente');
                showToast(`${selectedIds.length} anuncio(s) eliminado(s) correctamente`, "success");
            }

            setSelectedIds([]);
            fetchAds(); // Recargar lista
        } catch (error) {
            console.error('❌ [Cliente] Error crítico en eliminación batch:', error);
            showToast("Error al eliminar anuncios", "error");
        } finally {
            setLoading(false);
        }
    };



    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-gray-400" />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={14} className="text-primary-600" />
            : <ChevronDown size={14} className="text-primary-600" />;
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold admin-text">Anuncios</h1>
                    <p className="admin-text-muted mt-1">Gestiona los anuncios publicados</p>
                </div>
                <AddButton href="/console/free-ads/create" label="Nuevo Anuncio" />
            </div>

            {/* Filters */}
            <div className="admin-surface p-4 rounded-xl shadow-sm border admin-border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

                    {/* Category Filter */}
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange("category", e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat.$id} value={cat.slug}>{cat.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Residential Filter */}
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={filters.residential}
                            onChange={(e) => handleFilterChange("residential", e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                        >
                            <option value="">Todos los residenciales</option>
                            {residentials.map(res => (
                                <option key={res.$id} value={res.$id}>{res.nombre}</option>
                            ))}
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

                    {/* Vigencia Filter */}
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <select
                            value={filters.vigencia}
                            onChange={(e) => handleFilterChange("vigencia", e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                        >
                            <option value="all">Todas las vigencias</option>
                            <option value="expired">Caducados</option>
                            <option value="6days">A 6 días de caducar</option>
                            <option value="5days">A 5 días de caducar</option>
                            <option value="4days">A 4 días de caducar</option>
                            <option value="3days">A 3 días de caducar</option>
                            <option value="24hours">A 24 horas de caducar</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table View */}
            <div className="admin-surface rounded-xl border admin-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="admin-bg/50 admin-text-muted font-medium border-b admin-border">
                            <tr>
                                <th className="px-4 py-3 w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === ads.length && ads.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </th>
                                <th className="px-4 py-3 w-16">Imagen</th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('titulo')}>
                                    <div className="flex items-center gap-2">Título / Categoría <SortIcon columnKey="titulo" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('precio')}>
                                    <div className="flex items-center gap-2">Precio / Variantes <SortIcon columnKey="precio" /></div>
                                </th>
                                <th className="px-4 py-3">Residencial</th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('$createdAt')}>
                                    <div className="flex items-center gap-2">Fecha / Vigencia <SortIcon columnKey="$createdAt" /></div>
                                </th>
                                <th className="px-4 py-3 text-center">KPIs</th>
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
                                        <td className="px-4 py-3"><div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : ads.length === 0 ? (
                                <tr>
                                    <td colspan="8" className="px-4 py-12 text-center admin-text-muted">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="text-gray-300 dark:text-gray-600 mb-2" size={32} />
                                            <p>No se encontraron anuncios</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                ads.map((ad) => (
                                    <tr
                                        key={ad.$id}
                                        className="admin-hover transition-colors group"
                                    >
                                        <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(ad.$id)}
                                                onChange={() => handleSelectOne(ad.$id)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2" onClick={() => router.push(`/console/free-ads/${ad.$id}`)}>
                                            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-900 border admin-border flex-shrink-0 cursor-pointer">
                                                {ad.imagenes && ad.imagenes.length > 0 ? (
                                                    <img
                                                        src={ad.imagenes[0]}
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
                                        <td className="px-4 py-2 cursor-pointer" onClick={() => router.push(`/console/free-ads/${ad.$id}`)}>
                                            <div className="flex flex-col gap-1">
                                                <div className="font-medium admin-text line-clamp-1 max-w-[200px]" title={ad.titulo}>
                                                    {ad.titulo}
                                                </div>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface border admin-text w-fit">
                                                    {ad.categoria}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap cursor-pointer" onClick={() => router.push(`/console/free-ads/${ad.$id}`)}>
                                            <div className="flex flex-col gap-1">
                                                <div className="font-semibold admin-text">
                                                    {formatPrice(ad.precio)}
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${ad.variants && ad.variants.length > 0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                    {ad.variants ? ad.variants.length : 0} variante{ad.variants && ad.variants.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 admin-text-muted cursor-pointer">
                                            <div className="flex items-center gap-1.5 max-w-[150px]">
                                                <Building2 size={14} className="flex-shrink-0" />
                                                <span className="truncate" title={getResidentialName(ad)}>
                                                    {getResidentialName(ad)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 admin-text-muted cursor-pointer" onClick={() => router.push(`/console/free-ads/${ad.$id}`)}>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs whitespace-nowrap">
                                                    {new Date(ad.$createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                {(() => {
                                                    const expStatus = getExpirationStatus(ad);
                                                    const colors = {
                                                        expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                                                        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                                                        active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                                                        unknown: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                                    };
                                                    return (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${colors[expStatus.status]}`}>
                                                            {expStatus.text}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center cursor-pointer" onClick={() => router.push(`/console/free-ads/${ad.$id}`)}>
                                            <div className="flex flex-col gap-1.5 items-center">
                                                {/* Vistas */}
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <span className="font-medium admin-text">{ad.vistas || 0}</span>
                                                </div>
                                                {/* Pedidos */}
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                    </svg>
                                                    <span className="font-medium admin-text">{ad.total_pedidos || 0}</span>
                                                </div>
                                                {/* Reviews */}
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <svg className="w-3.5 h-3.5 text-amber-500 fill-current" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    <span className="font-medium admin-text">{ad.valoracion_promedio ? ad.valoracion_promedio.toFixed(1) : "0.0"}</span>
                                                    <span className="text-gray-400">({ad.total_reviews || 0})</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right cursor-pointer" onClick={() => router.push(`/console/free-ads/${ad.$id}`)}>
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

            {/* Barra de acciones flotante cuando hay items seleccionados */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-200">
                    <div className="admin-surface rounded-xl border admin-border shadow-2xl px-6 py-4 flex items-center gap-4">
                        <span className="text-sm font-medium admin-text">
                            {selectedIds.length} anuncio(s) seleccionado(s)
                        </span>
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                        <button
                            onClick={() => setShowBatchDeleteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <Trash2 size={16} />
                            Eliminar seleccionados
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="px-4 py-2 admin-hover admin-text rounded-lg transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {total > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-8 border-t admin-border pt-4 gap-4">
                    <div className="flex items-center gap-3">
                        <p className="text-sm admin-text-muted">
                            Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, total)} de {total} resultados
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm admin-text-muted">Mostrar:</span>
                            <select
                                value={limit}
                                onChange={(e) => handleLimitChange(Number(e.target.value))}
                                className="px-3 py-1.5 rounded-lg border admin-border admin-bg admin-text text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
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

            {/* Modal de confirmación para eliminación batch */}
            <ConfirmModal
                isOpen={showBatchDeleteModal}
                onClose={() => setShowBatchDeleteModal(false)}
                onConfirm={handleBatchDelete}
                title="Eliminar Anuncios"
                message={`¿Estás seguro de que deseas eliminar ${selectedIds.length} anuncio(s)? Esta acción no se puede deshacer.`}
                confirmText="Sí, eliminar todos"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
}
