"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { databases, ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { ChevronLeft, Save, HelpCircle, AlertCircle, Users, Calendar, CreditCard, Target, Plus, Trash2, Layout, ScanLine, X } from "lucide-react";
import ImageUpload from "@/components/console/ImageUpload";
import { useToast } from "@/context/ToastContext";
import { countries as countriesData } from "@/utils/countries";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
const COLLECTION_ID = "anuncios_pago";
const RESIDENTIALS_COLLECTION_ID = "residenciales"; // Verificado en ResidentialsPage
const CATEGORIES_COLLECTION_ID = "categorias"; // Verificado en CategoriesPage

export default function CreatePaidAdPage() {
    const router = useRouter();
    const { showToast } = useToast();

    // Data Loading States
    const [loadingData, setLoadingData] = useState(true);
    const [categories, setCategories] = useState([]);
    const [residentials, setResidentials] = useState([]);

    // Form States
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Grupo 1
        titulo: "",
        link: "",
        descripcion: "",
        categorias: [], // Array of IDs. Empty = All

        // Grupo 2
        type: "embedded", // embedded, banner, cross
        imagen: "",

        // Grupo 3
        creditos: 100,
        fechaInicio: "",
        fechaFin: "",

        active: true,
    });

    // Reach State (Group 4)
    const [selectedResidentials, setSelectedResidentials] = useState([]); // [{id, name, inhabitants}]
    const [residentialInput, setResidentialInput] = useState(""); // For search/select

    // Location Filters for Group 4
    const [filterCountry, setFilterCountry] = useState("");
    const [filterState, setFilterState] = useState("");

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

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [catsRes, resRes] = await Promise.all([
                    databases.listDocuments(DATABASE_ID, CATEGORIES_COLLECTION_ID, [Query.limit(100), Query.equal("activo", true)]),
                    databases.listDocuments(DATABASE_ID, RESIDENTIALS_COLLECTION_ID, [Query.limit(100)]) // Asumiendo que podrian ser mas, paginacion futura necesaria
                ]);

                setCategories(catsRes.documents);
                // Mapear residenciales asegurando campo habitantes (default 0 si no existe)
                setResidentials(resRes.documents.map(d => ({
                    id: d.$id,
                    name: d.nombre,
                    inhabitants: d.habitantes || 0,
                    country: d.country || "MX",
                    state: d.provincia_estado || ""
                })));
            } catch (error) {
                console.error("Error loading data:", error);
                showToast("Error al cargar datos auxiliares", "error");
            } finally {
                setLoadingData(false);
            }
        };

        loadInitialData();
    }, []);

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCategoryToggle = (catId) => {
        const allCategoryIds = categories.map(c => c.$id);
        const isCurrentlyAll = formData.categorias.length === 0 || formData.categorias.length === categories.length;

        setFormData(prev => {
            let newCategorias;

            if (catId === 'all') {
                // Clicking "TODAS" always resets to "All" (empty array)
                newCategorias = [];
            } else {
                if (isCurrentlyAll) {
                    // If currently ALL (empty or full), and we click one, we assume user wants to UNCHECK it
                    // because ALL means everything is selected.
                    newCategorias = allCategoryIds.filter(id => id !== catId);
                } else {
                    // Standard toggle
                    const isSelected = prev.categorias.includes(catId);
                    if (isSelected) {
                        newCategorias = prev.categorias.filter((id) => id !== catId);
                    } else {
                        newCategorias = [...prev.categorias, catId];
                    }
                }

                // If we ended up with 0 items, that defaults to All.
                // If we ended up with ALL items explicit, reset to Empty for All.
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
            setResidentialInput(""); // Reset dropdown
        }
    };

    const handleRemoveResidential = (resId) => {
        setSelectedResidentials(prev => prev.filter(r => r.id !== resId));
    };

    const calculateDailyImpact = (inhabitants) => {
        return Math.round(inhabitants * 0.33);
    };

    const totalDailyImpact = selectedResidentials.reduce((acc, curr) => acc + calculateDailyImpact(curr.inhabitants), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.titulo || !formData.link || !formData.imagen) {
            showToast("Por favor completa los campos requeridos", "error");
            return;
        }

        setLoading(true);

        try {
            // Preparar payload para el BFF
            // Convertimos los residenciales seleccionados a IDs
            const residentialIds = selectedResidentials.map(r => r.id);

            const requestBody = {
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                link: formData.link,
                type: formData.type,
                imagen: formData.imagen,
                active: formData.active,
                creditos: formData.creditos,
                fechaInicio: formData.fechaInicio,
                fechaFin: formData.fechaFin,
                categorias: formData.categorias,
                residenciales: residentialIds,
                dailyImpact: totalDailyImpact,
            };

            const response = await fetch('/api/paid-ads/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Server Error:", data);
                if (data.type === 'document_invalid_structure') {
                    // Check common missing attributes from error
                    throw new Error(`Error de estructura: ${data.error}. Verifica fechas y campos requeridos.`);
                }
                throw new Error(data.error || "Error al crear el anuncio");
            }

            showToast("Anuncio creado correctamente", "success");
            router.push("/console/ads");
        } catch (error) {
            console.error("Error creating ad:", error);
            showToast(error.message || "Error al conectar con el servidor", "error");
        } finally {
            setLoading(false);
        }
    };

    // Helper for image specs
    const getImageSpecs = () => {
        if (formData.type === 'banner') return { label: "Banner (900x340px)", aspect: "Aspecto 2.65:1" };
        return { label: "Cuadrado (500x500px)", aspect: "Aspecto 1:1" };
    };

    const hasData = formData.titulo || formData.descripcion || formData.link || formData.imagen;

    if (loadingData) {
        return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>;
    }

    return (
        <div className="p-6 max-w-5xl mx-auto pb-32">
            <div className="mb-8">
                <Link
                    href="/console/ads"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
                >
                    <ChevronLeft size={20} />
                    <span>Volver a Publicidad</span>
                </Link>
                <h1 className="text-2xl font-bold admin-text">Nueva Publicidad</h1>
                <p className="admin-text-muted mt-1">Configura los detalles, audiencia y alcance de tu campaña</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

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
                                value={formData.titulo}
                                onChange={(e) => handleChange("titulo", e.target.value)}
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
                                value={formData.link}
                                onChange={(e) => handleChange("link", e.target.value)}
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
                                value={formData.descripcion}
                                onChange={(e) => handleChange("descripcion", e.target.value)}
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
                                    value={formData.type}
                                    onChange={(e) => handleChange("type", e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                                >
                                    <option value="banner">Banner - Cabecera destacada</option>
                                    <option value="embedded">Embedded - Integrado en feed</option>
                                    <option value="cross">Cross - Promoción cruzada</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
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
                                    value={formData.creditos}
                                    onChange={(e) => handleChange("creditos", e.target.value)}
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
                                    value={formData.fechaInicio}
                                    onChange={(e) => handleChange("fechaInicio", e.target.value)}
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
                                    value={formData.fechaFin}
                                    onChange={(e) => handleChange("fechaFin", e.target.value)}
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
                            )}    {categories.length === 0 && <p className="text-sm text-gray-500 col-span-full">No hay categorías disponibles.</p>}
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
                                            setFilterState(""); // Reset state on country change
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
                                        disabled={!filterCountry && availableStates.length > 20} // Optional UX grouping
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
                                            setResidentialInput(""); // Clear the select after adding
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
                        <p className="text-xs admin-text-muted">
                            * El impacto diario se calcula estimando que el 33% de los habitantes acceden a la plataforma diariamente.
                        </p>
                    </div>
                </div>

                {/* Botones de Acción Flotantes */}
                {
                    hasData && (
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom duration-300 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                            <div className="max-w-5xl mx-auto flex items-center justify-between">
                                <div className="hidden md:flex items-center gap-4">
                                    <div className="text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Total Impacto Est.:</span>
                                        <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">{totalDailyImpact.toLocaleString()} / día</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 ml-auto">
                                    <Link
                                        href="/console/ads"
                                        className="px-6 py-2 rounded-lg border admin-border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                                Creando...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Crear Campaña
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </form >
        </div >
    );
}
