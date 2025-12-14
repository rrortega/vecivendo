"use client";

import { useEffect, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite"; // Added Query
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { ChevronLeft, BarChart2, Edit, Save, Trash2, ScanLine, Layout, CreditCard, Target, AlertCircle, Plus, Calendar } from "lucide-react"; // Expanded icons
import ImageUpload from "@/components/console/ImageUpload";
import { countries as countriesData } from "@/utils/countries"; // Added countries
import { getAdAnalytics } from "@/lib/analytics";
import TrafficAnalytics from "@/components/console/ads/TrafficAnalytics";
import ConfirmModal from "@/components/console/ConfirmModal";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
const RESIDENTIALS_COLLECTION_ID = "residenciales";
const CATEGORIES_COLLECTION_ID = "categorias";

// Placeholder components - in a real scenario these would be separate files
const PaidAdAnalytics = ({ ad }) => {
    const [metrics, setMetrics] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch basic metrics (spend, etc) AND logs logging (devices, etc)
                const [metricsRes, analyticsData] = await Promise.all([
                    fetch(`/api/paid-ads/${ad.$id}/metrics`),
                    getAdAnalytics(ad.$id, true) // true for isPaidAd
                ]);

                if (metricsRes.ok) {
                    const data = await metricsRes.json();
                    setMetrics(data);
                }

                setStats(analyticsData);

            } catch (error) {
                console.error("Error loading analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [ad.$id]);

    const totalSpend = metrics?.total?.spend || 0;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="admin-surface p-6 rounded-xl border admin-border">
                    <h3 className="admin-text-muted text-sm font-medium">Gastos Totales</h3>
                    <p className="text-3xl font-bold admin-text mt-2">${totalSpend.toFixed(2)}</p>
                </div>
                <div className="admin-surface p-6 rounded-xl border admin-border">
                    <h3 className="admin-text-muted text-sm font-medium">Vistas Totales</h3>
                    <p className="text-3xl font-bold admin-text mt-2">{ad.vistas || 0}</p>
                </div>
                <div className="admin-surface p-6 rounded-xl border admin-border">
                    <h3 className="admin-text-muted text-sm font-medium">Clicks Totales</h3>
                    <p className="text-3xl font-bold admin-text mt-2">{ad.clicks || 0}</p>
                </div>
                <div className="admin-surface p-6 rounded-xl border admin-border">
                    <h3 className="admin-text-muted text-sm font-medium">CTR Global</h3>
                    <p className="text-3xl font-bold admin-text mt-2">
                        {ad.vistas ? ((ad.clicks / ad.vistas) * 100).toFixed(2) : 0}%
                    </p>
                </div>
            </div>

            {/* Breakdown Table */}
            <div className="admin-surface rounded-xl border admin-border overflow-hidden">
                <div className="p-4 border-b admin-border">
                    <h3 className="font-semibold admin-text">Rendimiento por Residencial</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="admin-bg/50 admin-text-muted font-medium border-b admin-border">
                            <tr>
                                <th className="px-4 py-3">Residencial</th>
                                <th className="px-4 py-3 text-center">Impresiones</th>
                                <th className="px-4 py-3 text-center">Clicks</th>
                                <th className="px-4 py-3 text-center">CTR</th>
                                <th className="px-4 py-3 text-right">Gasto Est.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y admin-border">
                            {loading ? (
                                <tr><td colSpan="5" className="p-4 text-center">Cargando métricas...</td></tr>
                            ) : metrics?.breakdown?.length > 0 ? (
                                metrics.breakdown.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-medium">{item.name}</td>
                                        <td className="px-4 py-3 text-center">{item.views}</td>
                                        <td className="px-4 py-3 text-center">{item.clicks}</td>
                                        <td className="px-4 py-3 text-center">
                                            {item.views ? ((item.clicks / item.views) * 100).toFixed(1) : 0}%
                                        </td>
                                        <td className="px-4 py-3 text-right">${item.spend.toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center admin-text-muted">
                                        No hay datos detallados disponibles aún.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Traffic Analytics Charts */}
            <div className="pt-6 border-t admin-border">
                <h3 className="font-semibold admin-text mb-4">Detalle de Tráfico</h3>
                {stats ? (
                    <TrafficAnalytics stats={stats} />
                ) : (
                    <div className="text-center py-8 text-gray-400">Cargando detalles de tráfico...</div>
                )}
            </div>
        </div>
    );
};

const PaidAdEditForm = ({ ad }) => {
    const { showToast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Data Loading States
    const [loadingData, setLoadingData] = useState(true);
    const [categories, setCategories] = useState([]);
    const [residentials, setResidentials] = useState([]);

    // Reach State (Group 4)
    const [selectedResidentials, setSelectedResidentials] = useState([]);
    const [residentialInput, setResidentialInput] = useState("");

    // Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Location Filters for Group 4
    const [filterCountry, setFilterCountry] = useState("");
    const [filterState, setFilterState] = useState("");

    const [formData, setFormData] = useState({
        titulo: ad.titulo || "",
        descripcion: ad.descripcion || "",
        link: ad.link || "",
        type: ad.type || "embedded", // embedded, banner, cross
        active: ad.active ?? true,
        creditos: ad.creditos || 0,
        fechaInicio: ad.fecha_inicio ? ad.fecha_inicio.split('T')[0] : "",
        fechaFin: ad.fecha_fin ? ad.fecha_fin.split('T')[0] : "",
        imagen: ad.image_url || ad.imagen || "",
        categorias: Array.isArray(ad.categorias) ? ad.categorias.map(c => typeof c === 'object' ? c.$id : c) : [],
    });

    // Load available data (Categories & Residentials)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [catsRes, resRes] = await Promise.all([
                    databases.listDocuments(DATABASE_ID, CATEGORIES_COLLECTION_ID, [Query.limit(100), Query.equal("activo", true)]),
                    databases.listDocuments(DATABASE_ID, RESIDENTIALS_COLLECTION_ID, [Query.limit(100)])
                ]);

                setCategories(catsRes.documents);

                const mappedResidentials = resRes.documents.map(d => ({
                    id: d.$id,
                    name: d.nombre,
                    inhabitants: d.habitantes || 0,
                    country: d.country || "MX",
                    state: d.provincia_estado || ""
                }));
                setResidentials(mappedResidentials);

                // Initialize Selected Residentials from ad prop MATCHING the full residential objects
                if (ad.residenciales && ad.residenciales.length > 0) {
                    const adResIds = ad.residenciales.map(r => typeof r === 'object' ? r.$id : r);
                    const preSelected = mappedResidentials.filter(r => adResIds.includes(r.id));
                    setSelectedResidentials(preSelected);
                }

            } catch (error) {
                console.error("Error loading data:", error);
                showToast("Error al cargar datos auxiliares", "error");
            } finally {
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, [ad, showToast]);

    // Derive available options based on loaded residentials
    const availableCountries = [...new Set(residentials.map(r => r.country))];
    const availableStates = [...new Set(residentials
        .filter(r => !filterCountry || r.country === filterCountry)
        .map(r => r.state)
        .filter(Boolean)
    )];

    const filteredResidentials = residentials.filter(r => {
        if (filterCountry && r.country !== filterCountry) return false;
        if (filterState && r.state !== filterState) return false;
        return true;
    });

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Explicit handler for standard native inputs that emit events
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCategoryToggle = (catId) => {
        const allCategoryIds = categories.map(c => c.$id);
        const isCurrentlyAll = formData.categorias.length === 0 || formData.categorias.length === categories.length;

        setFormData(prev => {
            let newCategorias;

            if (catId === 'all') {
                newCategorias = [];
            } else {
                if (isCurrentlyAll) {
                    newCategorias = allCategoryIds.filter(id => id !== catId);
                } else {
                    const isSelected = prev.categorias.includes(catId);
                    if (isSelected) {
                        newCategorias = prev.categorias.filter((id) => id !== catId);
                    } else {
                        newCategorias = [...prev.categorias, catId];
                    }
                }

                if (newCategorias.length === 0 || newCategorias.length === categories.length) {
                    newCategorias = [];
                }
            }
            return { ...prev, categorias: newCategorias };
        });
    };

    const handleAddResidential = (resId) => {
        const residential = residentials.find(r => r.id === resId);
        if (residential && !selectedResidentials.some(r => r.id === resId)) {
            setSelectedResidentials([...selectedResidentials, residential]);
            setResidentialInput("");
        }
    };

    const handleRemoveResidential = (resId) => {
        setSelectedResidentials(prev => prev.filter(r => r.id !== resId));
    };

    const calculateDailyImpact = (inhabitants) => {
        return Math.round(inhabitants * 0.33);
    };

    const totalDailyImpact = selectedResidentials.reduce((acc, curr) => acc + calculateDailyImpact(curr.inhabitants), 0);

    const getImageSpecs = () => {
        if (formData.type === 'banner') return { label: "Banner (900x340px)", aspect: "Aspecto 2.65:1" };
        return { label: "Cuadrado (500x500px)", aspect: "Aspecto 1:1" };
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        setShowDeleteModal(false);
        setLoading(true);
        try {
            const res = await fetch(`/api/paid-ads/${ad.$id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Error al eliminar");
            showToast("Anuncio eliminado correctamente", "success");
            router.push("/console/ads");
        } catch (error) {
            console.error(error);
            showToast("Error al eliminar el anuncio", "error");
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const requestBody = {
                ...formData,
                residenciales: selectedResidentials.map(r => r.id),
                dailyImpact: totalDailyImpact,
            };

            const res = await fetch(`/api/paid-ads/${ad.$id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!res.ok) throw new Error("Error al actualizar");

            showToast("Anuncio actualizado correctamente", "success");
            router.refresh();
        } catch (error) {
            console.error(error);
            showToast("Error al guardar cambios", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
            {/* GRUPO 1: Información Básica */}
            <div className="admin-surface p-6 rounded-xl border admin-border space-y-6">
                <h2 className="text-lg font-semibold admin-text border-b admin-border pb-4 flex items-center gap-2">
                    <ScanLine size={20} className="text-primary-500" />
                    Información Básica
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium admin-text mb-2">
                            Título de la Campaña <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleInputChange}
                            placeholder="Ej: Oferta de Verano"
                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium admin-text mb-2">
                            Enlace de Destino <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            name="link"
                            value={formData.link}
                            onChange={handleInputChange}
                            placeholder="https://tu-sitio.com/promo"
                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium admin-text mb-2">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                            placeholder="Detalles visibles para el usuario..."
                        />
                    </div>
                </div>
            </div>

            {/* GRUPO 2: Multimedia y Formato */}
            <div className="admin-surface p-6 rounded-xl border admin-border space-y-6">
                <h2 className="text-lg font-semibold admin-text border-b admin-border pb-4 flex items-center gap-2">
                    <Layout size={20} className="text-primary-500" />
                    Formato y Multimedia
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium admin-text mb-3">Tipo de Anuncio</label>
                        <div className="relative">
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 rounded-xl border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                            >
                                <option value="banner">Banner - Cabecera destacada</option>
                                <option value="embedded">Embedded - Integrado en feed</option>
                                <option value="cross">Cross - Promoción cruzada</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium admin-text">Creatividad</label>
                            <span className="text-xs px-2 py-1 rounded bg-slate-900 text-white font-medium border border-transparent shadow-sm">
                                Formato: {getImageSpecs().label}
                            </span>
                        </div>
                        <ImageUpload
                            value={formData.imagen}
                            onChange={(url) => handleChange("imagen", url)}
                            bucketId="images"
                            label="Subir Imagen del Anuncio"
                            variant={formData.type === 'banner' ? 'banner' : 'square'}
                        />
                        <p className="text-xs admin-text-muted mt-2 text-center md:text-left">
                            Asegúrate de respetar la relación de aspecto ({getImageSpecs().aspect}) para evitar recortes indeseados.
                        </p>
                    </div>
                </div>
            </div>

            {/* GRUPO 3: Configuración de Campaña */}
            <div className="admin-surface p-6 rounded-xl border admin-border space-y-6">
                <h2 className="text-lg font-semibold admin-text border-b admin-border pb-4 flex items-center gap-2">
                    <CreditCard size={20} className="text-primary-500" />
                    Configuración de Campaña
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium admin-text mb-2">
                            Créditos Asignados
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input
                                type="number"
                                min="0"
                                name="creditos"
                                value={formData.creditos}
                                onChange={handleInputChange}
                                className="w-full pl-8 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <p className="text-xs admin-text-muted mt-1">Presupuesto inicial para esta campaña.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium admin-text mb-2">
                            Fecha de Inicio
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="date"
                                name="fechaInicio"
                                value={formData.fechaInicio}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium admin-text mb-2">
                            Fecha de Fin
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="date"
                                name="fechaFin"
                                value={formData.fechaFin}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>


                </div>
            </div>

            {/* GRUPO 4: Alcance y Segmentación */}
            <div className="admin-surface p-6 rounded-xl border admin-border space-y-6">
                <h2 className="text-lg font-semibold admin-text border-b admin-border pb-4 flex items-center gap-2">
                    <Target size={20} className="text-primary-500" />
                    Alcance y Segmentación
                </h2>

                <div className="space-y-6">
                    {/* Categorías (Moved from Group 1) */}
                    <div>
                        <label className="block text-sm font-medium admin-text mb-3">
                            Categorías Asociadas
                            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                (Si no seleccionas ninguna, se mostrará en todas)
                            </span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 border admin-border rounded-xl bg-gray-50/50 dark:bg-gray-800/20">
                            {/* TODAS Option */}
                            <label
                                className={`
                                    cursor-pointer rounded-lg border p-2 flex items-center gap-2 transition-all duration-200 h-full
                                    ${(formData.categorias.length === 0 || formData.categorias.length === categories.length)
                                        ? "bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-500/50 dark:text-primary-400 font-medium ring-1 ring-primary-500 ring-opacity-50"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"}
                                `}
                            >
                                <input
                                    type="checkbox"
                                    checked={formData.categorias.length === 0 || formData.categorias.length === categories.length}
                                    onChange={() => handleCategoryToggle('all')}
                                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                />
                                <span className="text-xs">TODAS</span>
                            </label>

                            {categories.map((cat) => {
                                const isAll = formData.categorias.length === 0 || formData.categorias.length === categories.length;
                                const isSelected = isAll || formData.categorias.includes(cat.$id);

                                return (
                                    <label
                                        key={cat.$id}
                                        className={`
                                            cursor-pointer rounded-lg border p-2 flex items-center gap-2 transition-all duration-200 h-full
                                            ${isSelected
                                                ? "bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-500/50 dark:text-primary-400 font-medium ring-1 ring-primary-500 ring-opacity-50"
                                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"}
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleCategoryToggle(cat.$id)}
                                            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                        />
                                        <span className="text-xs truncate" title={cat.nombre}>
                                            {cat.nombre}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        {/* Warning Message for Broad Targeting */}
                        {(formData.categorias.length === 0 || formData.categorias.length > 5) && (
                            <div className="mt-3 flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800 text-sm">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>
                                    <span className="font-semibold block mb-1">Sugerencia de Optimización</span>
                                    Para que su anuncio convierta mejor es mucho más eficiente segmentar estableciendo categorías afines. Así será menos invasivo y el usuario estará más propenso a dar clic si le mostramos el anuncio en una categoría en la que ya está dispuesto a acceder de forma orgánica.
                                </p>
                            </div>
                        )}
                        {categories.length === 0 && <p className="text-sm text-gray-500 col-span-full">No hay categorías disponibles.</p>}
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-4"></div>

                    <div className="flex flex-col gap-4">
                        <label className="block text-sm font-medium admin-text">Agregar Residencial Objetivo</label>

                        {/* Cascading Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={filterCountry}
                                    onChange={(e) => {
                                        setFilterCountry(e.target.value);
                                        setFilterState("");
                                    }}
                                >
                                    <option value="">Todos los Países</option>
                                    {availableCountries.map(code => (
                                        <option key={code} value={code}>
                                            {countriesData[code]?.name || code}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={filterState}
                                    onChange={(e) => setFilterState(e.target.value)}
                                    disabled={!filterCountry && availableStates.length > 20}
                                >
                                    <option value="">Todos los Estados</option>
                                    {availableStates.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <select
                                    className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={residentialInput}
                                    onChange={(e) => setResidentialInput(e.target.value)}
                                    disabled={filteredResidentials.length === 0}
                                >
                                    <option value="">
                                        {filteredResidentials.length === 0
                                            ? "Sin residenciales diponibles"
                                            : "Seleccionar residencial..."
                                        }
                                    </option>
                                    {filteredResidentials
                                        .filter(r => !selectedResidentials.some(sr => sr.id === r.id))
                                        .map(r => (
                                            <option key={r.id} value={r.id}>{r.name} ({r.inhabitants} hab.)</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>

                        {residentialInput && (
                            <div className="flex justify-end animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleAddResidential(residentialInput);
                                        setResidentialInput("");
                                    }}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2 font-medium"
                                >
                                    <Plus size={18} />
                                    AGREGAR "{residentials.find(r => r.id === residentialInput)?.name}"
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Tabla de Residenciales Seleccionados */}
                    <div className="border admin-border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-4 py-3 font-medium admin-text">Residencial</th>
                                    <th className="px-4 py-3 font-medium admin-text text-right">Habitantes</th>
                                    <th className="px-4 py-3 font-medium admin-text text-right">Impacto Calculado</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y admin-border">
                                {selectedResidentials.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center admin-text-muted italic">
                                            No hay residenciales seleccionados. El anuncio no se mostrará a ninguna audiencia específica.
                                        </td>
                                    </tr>
                                ) : (
                                    selectedResidentials.map(res => (
                                        <tr key={res.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 admin-text font-medium">{res.name}</td>
                                            <td className="px-4 py-3 admin-text-muted text-right">{res.inhabitants.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-medium text-right">
                                                ~{calculateDailyImpact(res.inhabitants).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveResidential(res.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {selectedResidentials.length > 0 && (
                                <tfoot className="bg-gray-50 dark:bg-gray-800/50 font-semibold">
                                    <tr>
                                        <td className="px-4 py-3 admin-text">Total Estimado</td>
                                        <td className="px-4 py-3 text-right admin-text">
                                            {selectedResidentials.reduce((a, b) => a + (b.inhabitants || 0), 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
                                            ~{totalDailyImpact.toLocaleString()} imp/día
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>

            {/* GRUPO 5: Acciones Peligrosas */}
            <div className="admin-surface p-6 rounded-xl border border-red-200 dark:border-red-900/30 space-y-6 bg-gradient-to-t from-red-500/10 to-transparent">
                <h2 className="text-lg font-semibold admin-text border-b border-red-200 dark:border-red-900/30 pb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle size={20} />
                    Zona de Acciones Peligrosas
                </h2>

                <div className="flex flex-col gap-4">
                    {/* Row 1: Active/Inactive */}
                    <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-red-100 dark:border-red-900/20 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.active ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'}`}>
                                <ScanLine size={20} />
                            </div>
                            <div>
                                <h4 className="font-medium admin-text">Visibilidad del Anuncio</h4>
                                <p className="text-xs admin-text-muted">{formData.active ? 'El anuncio está visible al público' : 'El anuncio está oculto y no consume créditos'}</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleInputChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                    </div>

                    {/* Row 2: Delete */}
                    <button
                        type="button"
                        onClick={handleDeleteClick}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm font-medium"
                    >
                        <Trash2 size={18} />
                        Eliminar Anuncio Definitivamente
                    </button>
                </div>
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom duration-300 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="hidden md:flex items-center gap-4">
                        <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Total Impacto Est.:</span>
                            <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">{totalDailyImpact.toLocaleString()} / día</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 ml-auto">
                        <button
                            type="button"
                            onClick={() => router.push('/console/ads')}
                            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary-600 text-white px-8 py-2.5 rounded-lg hover:bg-primary-700 transition-all font-medium flex items-center gap-2 shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Anuncio Definitivamente"
                message="¿Estás seguro de que deseas eliminar este anuncio? Esta acción eliminara todos los datos asociados y no se puede deshacer."
                confirmText="Sí, eliminar definitivamente"
                cancelText="Cancelar"
                variant="danger"
            />
        </form>
    );
};

export default function PaidAdDetailsPage({ params }) {
    const { id } = params;
    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("analytics");
    const { showToast } = useToast();
    const router = useRouter();

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

    useEffect(() => {
        fetchAd();
    }, [id]);

    const fetchAd = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/paid-ads/${id}`);

            if (!response.ok) {
                throw new Error("Error al cargar el anuncio");
            }

            const data = await response.json();
            setAd(data);
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
