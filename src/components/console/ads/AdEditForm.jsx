"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { useToast } from "@/context/ToastContext";
import { Save, Trash2, AlertTriangle, FileText, Image, Package } from "lucide-react";

import { useRouter } from "next/navigation";
import { Query } from "appwrite"; // ID removed
import VariantsManager from "@/components/console/ads/VariantsManager";
import ConfirmModal from "@/components/console/ConfirmModal";


export default function AdEditForm({ ad }) {
    const isEditing = !!ad;
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const getCleanFormData = (adData) => ({
        titulo: adData?.titulo || "",
        descripcion: adData?.descripcion || "",
        precio: adData?.precio || 0,
        categoria: adData?.categoria || "",
        residencial: adData?.residencial || "",
        celular_anunciante: adData?.celular_anunciante || "",
        dias_vigencia: adData?.dias_vigencia || 7,
        imagenes: adData?.imagenes || [],
        variants: adData?.variants || [],
        active: adData?.activo ?? true,
    });

    const [formData, setFormData] = useState(getCleanFormData(ad));
    const [residentials, setResidentials] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const [saving, setSaving] = useState(false);

    const [activeTab, setActiveTab] = useState('basic');
    const [errorMessage, setErrorMessage] = useState("");
    const { showToast } = useToast();
    const router = useRouter();

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "anuncios";

    useEffect(() => {
        console.log("AdEditForm mounted. Full Ad Object:", ad);
        fetchResidentials();
        fetchCategories();
        const cleanData = getCleanFormData(ad);
        setFormData(cleanData);
        setInitialData(cleanData);
        setIsDirty(false);
    }, [ad]);

    useEffect(() => {
        if (initialData) {
            const isChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
            setIsDirty(isChanged);
        }
    }, [formData, initialData]);


    const fetchResidentials = async () => {
        try {
            const response = await databases.listDocuments(dbId, "residenciales", [
                Query.limit(100),
                Query.orderAsc("nombre")
            ]);
            setResidentials(response.documents);
        } catch (error) {
            console.error("Error fetching residentials:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await databases.listDocuments(dbId, "categorias", [
                Query.equal("activo", true),
                Query.orderAsc("orden")
            ]);
            setCategories(response.documents);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "celular_anunciante") {
            // Permitir solo números y el signo + al inicio
            const isValid = /^\+?[0-9]*$/.test(value);
            if (!isValid) return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleImageChange = (index, value) => {
        const newImages = [...formData.imagenes];
        newImages[index] = value;
        setFormData(prev => ({ ...prev, imagenes: newImages }));
    };

    const addImageField = () => {
        setFormData(prev => ({ ...prev, imagenes: [...prev.imagenes, ""] }));
    };

    const removeImageField = (index) => {
        const newImages = formData.imagenes.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, imagenes: newImages }));
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleReset = () => {
        if (initialData) setFormData(initialData);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        try {
            const data = {
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                precio: parseFloat(formData.precio),
                categoria: formData.categoria,
                residencial: formData.residencial || null,
                celular_anunciante: formData.celular_anunciante || null,
                dias_vigencia: parseInt(formData.dias_vigencia),
                imagenes: formData.imagenes.filter(url => url && isValidUrl(url)),
                variants: formData.variants,
                activo: formData.active
            };

            console.log('📤 Enviando datos del anuncio:', data);

            let response;
            if (isEditing) {
                response = await fetch(`/api/ads/${ad.$id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                response = await fetch('/api/ads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al guardar el anuncio');
            }

            showToast(isEditing ? "Anuncio actualizado correctamente" : "Anuncio creado correctamente", "success");

            if (isEditing) {
                router.refresh();
            } else {
                router.push("/console/free-ads");
            }
        } catch (error) {
            console.error('❌ Error:', error);
            setErrorMessage(error.message || "Error desconocido");
            showToast(isEditing ? "Error al actualizar el anuncio" : "Error al crear el anuncio", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/ads/${ad.$id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar el anuncio');
            }

            showToast("Anuncio eliminado correctamente", "success");
            router.push("/console/free-ads");
        } catch (error) {
            console.error('❌ Error eliminando anuncio:', error);
            showToast("Error al eliminar el anuncio", "error");
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'basic', label: 'Información Básica', icon: FileText },
        { id: 'images', label: 'Imágenes', icon: Image },
        { id: 'variants', label: 'Variantes', icon: Package },
    ];

    return (
        <div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b admin-border overflow-x-auto">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'border-primary-600 text-primary-600 font-medium'
                                : 'border-transparent admin-text-muted hover:text-primary-600'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                    <p className="font-medium">Error:</p>
                    <p>{errorMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

                <div className="admin-surface rounded-xl border admin-border shadow-sm p-6">
                    {/* TAB: INFORMACIÓN BÁSICA */}
                    {activeTab === 'basic' && (
                        <div className="space-y-8">
                            {/* SECCIÓN 1: INFORMACIÓN DEL ANUNCIANTE */}
                            <div>
                                <h3 className="text-lg font-semibold admin-text mb-4 pb-2 border-b admin-border">
                                    Información del Anunciante
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium admin-text">Celular del Anunciante</label>
                                        <input
                                            type="tel"
                                            name="celular_anunciante"
                                            value={formData.celular_anunciante}
                                            onChange={handleChange}
                                            placeholder="Ej: 5512345678"
                                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                        <p className="text-xs admin-text-muted">Número de contacto del anunciante (opcional)</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium admin-text">Residencial</label>
                                        <select
                                            name="residencial"
                                            value={formData.residencial}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        >
                                            <option value="">Sin residencial</option>
                                            {residentials.map((res) => (
                                                <option key={res.$id} value={res.$id}>
                                                    {res.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs admin-text-muted">Residencial al que pertenece este anuncio (opcional)</p>
                                    </div>
                                </div>
                            </div>

                            {/* SECCIÓN 2: INFORMACIÓN DEL ANUNCIO */}
                            <div>
                                <h3 className="text-lg font-semibold admin-text mb-4 pb-2 border-b admin-border">
                                    Información del Anuncio
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium admin-text">Título</label>
                                        <input
                                            type="text"
                                            name="titulo"
                                            value={formData.titulo}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium admin-text">Precio</label>
                                        <input
                                            type="number"
                                            name="precio"
                                            value={formData.precio}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium admin-text">Días de Vigencia</label>
                                        <input
                                            type="number"
                                            name="dias_vigencia"
                                            value={formData.dias_vigencia}
                                            onChange={handleChange}
                                            min="1"
                                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium admin-text">Categoría</label>
                                        <select
                                            name="categoria"
                                            value={formData.categoria}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                            required
                                        >
                                            <option value="">Seleccionar categoría</option>
                                            {categories.map(cat => (
                                                <option key={cat.$id} value={cat.slug}>
                                                    {cat.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-6">
                                    <label className="text-sm font-medium admin-text">Descripción</label>
                                    <textarea
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: IMÁGENES */}
                    {activeTab === 'images' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium admin-text">URLs de Imágenes o Videos</label>
                                <div className="space-y-3">
                                    {formData.imagenes.map((url, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="url"
                                                value={url}
                                                onChange={(e) => handleImageChange(index, e.target.value)}
                                                placeholder="https://ejemplo.com/imagen.jpg"
                                                className={`flex-1 px-4 py-2 rounded-lg border ${url && !isValidUrl(url) ? 'border-red-500 focus:ring-red-500' : 'admin-border focus:ring-primary-500'} admin-bg admin-text focus:ring-2 outline-none`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImageField(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addImageField}
                                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
                                    >
                                        + Agregar otra imagen
                                    </button>
                                </div>
                            </div>


                        </div>
                    )}

                    {/* TAB: VARIANTES */}
                    {activeTab === 'variants' && (
                        <div>
                            <VariantsManager
                                variants={formData.variants}
                                onChange={(newVariants) => setFormData(prev => ({ ...prev, variants: newVariants }))}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-8   rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden">
                    <div className="px-6 py-4  bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
                        <AlertTriangle className="text-red-600 " size={20} />
                        <h3 className="font-semibold text-red-800 ">Zona de Peligro</h3>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Toggle Active */}


                        <div className="  flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-gray-500">Activar/Desactivar</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Al desactivar el anuncio deja de estar publicado en el marketplaces
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="ml-3 text-sm font-medium admin-text">
                                    {formData.active ? "Activo" : "Inactivo"}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="active"
                                        checked={formData.active}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-surface border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer   peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>

                                </label>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6 flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-gray-500">Eliminar Anuncio</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Esta acción es irreversible, se eliminara el anuncio, la imagen y toda la analítica.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                disabled={loading}
                            >
                                <Trash2 size={20} />
                                <span>Eliminar Anuncio</span>
                            </button>
                        </div>
                    </div>
                </div>

            </form >






            {/* Modal de confirmación para eliminar */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Eliminar Anuncio"
                message={`¿Estás seguro de que deseas eliminar el anuncio "${ad?.titulo}"? Esta acción no se puede deshacer.`}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="danger"
            />

            {/* Desktop Bottom Save Bar */}
            <div className={`hidden md:flex fixed bottom-0 right-0 left-64 admin-surface border-t admin-border p-4 shadow-lg transform transition-transform duration-300 justify-between items-center z-40 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    Tienes cambios sin guardar
                </div>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Descartar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className={`px-6 py-2 rounded-lg text-white font-medium transition-all ${saving
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl"
                            }`}
                    >
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </div>

            {/* Mobile Floating Save Button */}
            <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className={`md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-50 transition-all duration-300 ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
                    } ${saving
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800"
                    }`}
            >
                <Save size={24} />
            </button>

        </div >

    );
}
