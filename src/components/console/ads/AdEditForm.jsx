'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText,
    Image,
    Package,
    Save,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { useToast } from "@/context/ToastContext";
import { AuthService } from "@/lib/auth-service";
import ImageUploader from './ImageUploader';
import VariantsManager from './VariantsManager';
import ConfirmModal from '../ConfirmModal';

export default function AdEditForm({ ad, hideAdvertiserFields = false, onDeleteSuccess }) {
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
    const [saving, setSaving] = useState(false);

    const [activeTab, setActiveTab] = useState('basic');
    const [errorMessage, setErrorMessage] = useState("");
    const { showToast } = useToast();
    const router = useRouter();

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resResponse, catResponse] = await Promise.all([
                    fetch('/api/residentials'),
                    fetch('/api/categories')
                ]);

                if (resResponse.ok && catResponse.ok) {
                    const resData = await resResponse.json();
                    const catData = await catResponse.json();
                    setResidentials(resData.documents || []);
                    setCategories(catData.documents || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setIsDirty(true);
    };

    const handleReset = () => {
        setFormData(getCleanFormData(ad));
        setIsDirty(false);
    };

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setSaving(true);
        setErrorMessage("");
        try {
            const selectedCategory = categories.find(c => c.slug === formData.categoria);
            const data = {
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                precio: parseFloat(formData.precio),
                categoria: selectedCategory ? selectedCategory.nombre : formData.categoria,
                categoria_slug: selectedCategory ? selectedCategory.slug : (formData.categoria ? formData.categoria.toLowerCase() : null),
                residencial: formData.residencial || null,
                celular_anunciante: formData.celular_anunciante || null,
                dias_vigencia: parseInt(formData.dias_vigencia),
                imagenes: formData.imagenes.filter(url => url && isValidUrl(url)),
                variants: formData.variants,
                activo: formData.active,
                last_capture: new Date().toISOString()
            };

            console.log('📤 Enviando datos del anuncio:', data);

            // Get valid JWT from AuthService (handles caching)
            const jwtToken = await AuthService.getJWT();

            let response;
            if (isEditing) {
                response = await fetch(`/api/ads/${ad.$id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`
                    },
                    body: JSON.stringify(data)
                });
            } else {
                response = await fetch('/api/ads', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${jwtToken}`
                    },
                    body: JSON.stringify(data)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al guardar el anuncio');
            }

            showToast(isEditing ? "Anuncio actualizado correctamente" : "Anuncio creado correctamente", "success");
            setIsDirty(false);

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
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            // Get valid JWT from AuthService (handles caching)
            const jwtToken = await AuthService.getJWT();

            const response = await fetch(`/api/ads/${ad.$id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`
                }
            });

            if (!response.ok) throw new Error('Error al eliminar el anuncio');

            showToast("Anuncio eliminado correctamente", "success");
            setShowDeleteModal(false);

            if (onDeleteSuccess) {
                onDeleteSuccess();
            } else {
                router.push("/console/free-ads");
            }
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
                            {!hideAdvertiserFields && (
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
                            )}

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

                    {activeTab === 'images' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium admin-text">Galería de Imágenes</label>
                                    <span className="text-xs admin-text-muted">{formData.imagenes.length} imágenes</span>
                                </div>
                                <ImageUploader
                                    images={formData.imagenes}
                                    onChange={(newImages) => setFormData(prev => ({ ...prev, imagenes: newImages }))}
                                    adId={ad?.$id}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'variants' && (
                        <div>
                            <VariantsManager
                                variants={formData.variants}
                                onChange={(newVariants) => setFormData(prev => ({ ...prev, variants: newVariants }))}
                            />
                        </div>
                    )}
                </div>

                {isEditing && (
                    <div className="mt-8 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden">
                        <div className="px-6 py-4 bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
                            <AlertTriangle className="text-red-600" size={20} />
                            <h3 className="font-semibold text-red-800">Zona de Peligro</h3>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
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
                                    <label className="relative inline-flex items-center cursor-pointer ">
                                        <input
                                            type="checkbox"
                                            name="active"
                                            checked={formData.active}
                                            onChange={handleChange}
                                            className="sr-only peer "
                                        />
                                        <div className="w-11  h-6 bg-surface border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black peer-checked:after:bg-black after:content-[''] after:absolute after:top-[2px] after:left-[2px]   after:border-white after:bg-black/30 after:border-2 after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-primary-600 transition-all"></div>
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
                                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-600"></div>
                                    ) : (
                                        <Trash2 size={20} />
                                    )}
                                    <span>{loading ? "Eliminando..." : "Eliminar Anuncio"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Espaciador para la barra fija inferior */}
                <div className="h-24 md:h-32" />
            </form>

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
            <div className={`hidden md:flex fixed bottom-0 right-0 ${hideAdvertiserFields ? 'left-0' : 'left-64'} admin-surface border-t admin-border p-4 shadow-lg transform transition-transform duration-300 justify-between items-center z-40 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}>
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
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-all ${saving
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl"
                            }`}
                    >
                        {saving && (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        )}
                        <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
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
                {saving ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                ) : (
                    <Save size={24} />
                )}
            </button>
        </div>
    );
}
