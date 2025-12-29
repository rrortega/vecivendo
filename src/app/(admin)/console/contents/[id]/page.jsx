"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";
import { ArrowLeft, Save, Trash2, AlertTriangle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import ContentEditor from "@/components/console/ContentEditor";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = "contenidos";

export default function EditContentPage() {
    const router = useRouter();
    const params = useParams();
    const contentId = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("config");
    const [formData, setFormData] = useState({
        titulo: "",
        descripcion: "",
        contenido_largo: "",
        foto_url: "",
        palabras_clave: "",
        tipo_contenido: "help",
        category: "",
        slug: "",
        active: true,
    });

    useEffect(() => {
        fetchContent();
    }, [contentId]);

    async function fetchContent() {
        try {
            setLoading(true);
            const doc = await databases.getDocument(
                DATABASE_ID,
                COLLECTION_ID,
                contentId
            );

            setFormData({
                titulo: doc.titulo || "",
                descripcion: doc.descripcion || "",
                contenido_largo: doc.contenido_largo || "",
                foto_url: doc.foto_url || "",
                palabras_clave: doc.palabras_clave || "",
                tipo_contenido: doc.tipo_contenido || "help",
                category: doc.category || "",
                slug: doc.slug || "",
                active: doc.active ?? true,
            });
        } catch (err) {
            console.error("Error fetching content:", err);
            setError("Error al cargar el contenido");
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!formData.titulo.trim()) {
            setError("El título es requerido");
            return;
        }
        if (!formData.descripcion.trim()) {
            setError("La descripción es requerida");
            return;
        }
        if (!formData.contenido_largo.trim()) {
            setError("El contenido es requerido");
            return;
        }
        if (!formData.category.trim()) {
            setError("La categoría es requerida");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(`/api/contents/${contentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    titulo: formData.titulo.trim(),
                    descripcion: formData.descripcion.trim(),
                    contenido_largo: formData.contenido_largo.trim(),
                    foto_url: formData.foto_url.trim() || null,
                    palabras_clave: formData.palabras_clave.trim() || null,
                    tipo_contenido: formData.tipo_contenido,
                    category: formData.category.trim(),
                    active: formData.active,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al actualizar el contenido');
            }

            router.push("/console/contents");
        } catch (err) {
            console.error("Error updating content:", err);
            setError(
                err.message ||
                "Error al actualizar el contenido. Por favor intenta de nuevo."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);

            const response = await fetch(`/api/contents/${contentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar el contenido');
            }

            router.push("/console/contents");
        } catch (err) {
            console.error("Error deleting content:", err);
            setError(err.message || "Error al eliminar el contenido");
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/console/contents"
                        className="p-2 admin-surface rounded-lg admin-hover admin-border"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold admin-text">
                            Editar Contenido
                        </h1>
                        <p className="admin-text-muted mt-1">
                            Modifica los campos que desees actualizar
                        </p>
                    </div>
                </div>

                <div></div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Tabs */}
                <div className="flex gap-2 border-b admin-border mb-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'config'
                            ? 'border-primary-500 text-primary-500'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Configuración
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('content')}
                        className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'content'
                            ? 'border-primary-500 text-primary-500'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Contenido
                    </button>
                </div>

                {/* Tab: Configuración */}
                <div className={activeTab === 'config' ? 'block' : 'hidden'}>
                    <div className="admin-surface rounded-lg p-6 space-y-6 border admin-border">
                        {/* Título */}
                        <div>
                            <label className="block text-sm font-medium admin-text mb-2">
                                Título <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.titulo}
                                onChange={(e) => handleChange("titulo", e.target.value)}
                                className="w-full px-4 py-2 admin-input rounded-lg"
                                placeholder="Ej: ¿Cómo publicar un anuncio?"
                                required
                            />
                        </div>

                        {/* Slug (readonly) */}
                        <div>
                            <label className="block text-sm font-medium admin-text mb-2">
                                Slug (solo lectura)
                            </label>
                            <input
                                type="text"
                                value={formData.slug}
                                readOnly
                                className="w-full px-4 py-2 admin-input rounded-lg bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                            />
                            <p className="text-xs admin-text-muted mt-1">
                                El slug no se puede modificar después de crear el contenido
                            </p>
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-sm font-medium admin-text mb-2">
                                Descripción Corta <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.descripcion}
                                onChange={(e) =>
                                    handleChange("descripcion", e.target.value)
                                }
                                className="w-full px-4 py-2 admin-input rounded-lg resize-y"
                                rows="3"
                                placeholder="Breve descripción del contenido (máx. 500 caracteres). Se usa en cards y previews."
                                maxLength="500"
                                required
                            />
                            <p className="text-xs admin-text-muted mt-1">
                                {formData.descripcion.length}/500 caracteres
                            </p>
                        </div>

                        {/* Tipo y Categoría */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium admin-text mb-2">
                                    Tipo de Contenido <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.tipo_contenido}
                                    onChange={(e) =>
                                        handleChange("tipo_contenido", e.target.value)
                                    }
                                    className="w-full px-4 py-2 admin-input rounded-lg"
                                    required
                                >
                                    <option value="help">Ayuda</option>
                                    <option value="faqs">FAQs</option>
                                    <option value="blog">Blog</option>
                                    <option value="policy">Políticas</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium admin-text mb-2">
                                    Categoría <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) =>
                                        handleChange("category", e.target.value)
                                    }
                                    className="w-full px-4 py-2 admin-input rounded-lg"
                                    placeholder="Ej: General, Registro, Ventas"
                                    required
                                />
                            </div>
                        </div>

                        {/* Foto URL y Palabras Clave */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium admin-text mb-2">
                                    URL de Foto (opcional)
                                </label>
                                <input
                                    type="url"
                                    value={formData.foto_url}
                                    onChange={(e) =>
                                        handleChange("foto_url", e.target.value)
                                    }
                                    className="w-full px-4 py-2 admin-input rounded-lg"
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium admin-text mb-2">
                                    Palabras Clave (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.palabras_clave}
                                    onChange={(e) =>
                                        handleChange("palabras_clave", e.target.value)
                                    }
                                    className="w-full px-4 py-2 admin-input rounded-lg"
                                    placeholder="palabra1, palabra2, palabra3"
                                />
                                <p className="text-xs admin-text-muted mt-1">
                                    Separadas por comas
                                </p>
                            </div>
                        </div>

                        {/* Zona de Peligro */}
                        <div className="border border-red-200 dark:border-red-900/50 rounded-lg overflow-hidden mt-8">
                            <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-900/50 flex items-center gap-2">
                                <ShieldAlert size={20} className="text-red-600 dark:text-red-400" />
                                <h3 className="font-semibold text-red-900 dark:text-red-200">Zona de Peligro</h3>
                            </div>
                            <div className="p-6 bg-surface space-y-6">
                                {/* Estado (Activación) */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium admin-text">Visibilidad del Contenido</h4>
                                        <p className="text-sm admin-text-muted mt-1">
                                            {formData.active
                                                ? "El contenido es visible para todos los usuarios."
                                                : "El contenido está oculto y no aparecerá en el sitio."}
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) =>
                                                handleChange("active", e.target.checked)
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                                    </label>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-800"></div>

                                {/* Eliminar */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-red-600 dark:text-red-400">Eliminar Contenido</h4>
                                        <p className="text-sm admin-text-muted mt-1">
                                            Una vez eliminado, no se podrá recuperar este contenido. Por favor, asegúrate.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteModal(true)}
                                        disabled={deleting}
                                        className="px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Eliminar Definitivamente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab: Contenido */}
                <div className={activeTab === 'content' ? 'block' : 'hidden'}>
                    <div className="admin-surface rounded-lg p-6 border admin-border">
                        <ContentEditor
                            value={formData.contenido_largo}
                            onChange={(value) => handleChange("contenido_largo", value)}
                            label="Contenido Detallado del Artículo"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t admin-border">
                    <Link
                        href="/console/contents"
                        className="px-6 py-2 admin-surface admin-border rounded-lg admin-hover text-center"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
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
            </form>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="¿Eliminar contenido?"
                message="Estás a punto de eliminar este contenido permanentemente. Esta acción no se puede deshacer."
                confirmText="Sí, eliminar"
                variant="destructive"
            />
        </div>
    );
}
