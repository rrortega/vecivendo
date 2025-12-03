"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { databases } from "@/lib/appwrite";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import ContentEditor from "@/components/console/ContentEditor";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = "contenidos";

export default function EditContentPage() {
    const router = useRouter();
    const params = useParams();
    const contentId = params.id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");
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

            await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                contentId,
                {
                    titulo: formData.titulo.trim(),
                    descripcion: formData.descripcion.trim(),
                    contenido_largo: formData.contenido_largo.trim(),
                    foto_url: formData.foto_url.trim() || null,
                    palabras_clave: formData.palabras_clave.trim() || null,
                    tipo_contenido: formData.tipo_contenido,
                    category: formData.category.trim(),
                    active: formData.active,
                }
            );

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
        if (
            !confirm(
                "¿Estás seguro de que deseas eliminar este contenido? Esta acción no se puede deshacer."
            )
        ) {
            return;
        }

        try {
            setDeleting(true);
            await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, contentId);
            router.push("/console/contents");
        } catch (err) {
            console.error("Error deleting content:", err);
            setError("Error al eliminar el contenido");
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

                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {deleting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Eliminando...
                        </>
                    ) : (
                        <>
                            <Trash2 size={18} />
                            Eliminar
                        </>
                    )}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                            Descripción <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.descripcion}
                            onChange={(e) =>
                                handleChange("descripcion", e.target.value)
                            }
                            className="w-full px-4 py-2 admin-input rounded-lg resize-y"
                            rows="3"
                            placeholder="Breve descripción del contenido (máx. 500 caracteres)"
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

                    {/* Estado */}
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={(e) =>
                                    handleChange("active", e.target.checked)
                                }
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
                        </label>
                        <span className="text-sm font-medium admin-text">
                            Contenido activo (visible en el sitio)
                        </span>
                    </div>
                </div>

                {/* Contenido Largo (Markdown Editor) */}
                <div className="admin-surface rounded-lg p-6 border admin-border">
                    <ContentEditor
                        value={formData.contenido_largo}
                        onChange={(value) => handleChange("contenido_largo", value)}
                        label={
                            <>
                                Contenido <span className="text-red-500">*</span>
                            </>
                        }
                    />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
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
        </div>
    );
}
