"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { databases } from "@/lib/appwrite";
import { ID } from "appwrite";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import ContentEditor from "@/components/console/ContentEditor";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = "contenidos";

export default function CreateContentPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
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

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError("");
    };

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
            .trim()
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/-+/g, "-"); // Remove multiple hyphens
    };

    const handleTitleBlur = () => {
        if (formData.titulo && !formData.slug) {
            handleChange("slug", generateSlug(formData.titulo));
        }
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

        // Generate slug if not set
        const slug = formData.slug || generateSlug(formData.titulo);

        try {
            setSaving(true);

            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                ID.unique(),
                {
                    titulo: formData.titulo.trim(),
                    descripcion: formData.descripcion.trim(),
                    contenido_largo: formData.contenido_largo.trim(),
                    foto_url: formData.foto_url.trim() || null,
                    palabras_clave: formData.palabras_clave.trim() || null,
                    tipo_contenido: formData.tipo_contenido,
                    category: formData.category.trim(),
                    slug: slug,
                    active: formData.active,
                }
            );

            router.push("/console/contents");
        } catch (err) {
            console.error("Error creating content:", err);
            setError(
                err.message || "Error al crear el contenido. Por favor intenta de nuevo."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/console/contents"
                    className="p-2 admin-surface rounded-lg admin-hover admin-border"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold admin-text">
                        Crear Nuevo Contenido
                    </h1>
                    <p className="admin-text-muted mt-1">
                        Completa el formulario para crear un nuevo artículo
                    </p>
                </div>
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
                            onBlur={handleTitleBlur}
                            className="w-full px-4 py-2 admin-input rounded-lg"
                            placeholder="Ej: ¿Cómo publicar un anuncio?"
                            required
                        />
                    </div>

                    {/* Slug (readonly) */}
                    <div>
                        <label className="block text-sm font-medium admin-text mb-2">
                            Slug (generado automáticamente)
                        </label>
                        <input
                            type="text"
                            value={formData.slug}
                            readOnly
                            className="w-full px-4 py-2 admin-input rounded-lg bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                            placeholder="Se generará desde el título"
                        />
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
                                Creando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Crear Contenido
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
