"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";

export default function CategoryForm({ category, onSubmit, loading }) {
    const [formData, setFormData] = useState({
        nombre: category?.nombre || "",
        icono: category?.icono || "Tag",
        slug: category?.slug || "",
        descripcion: category?.descripcion || "",
        orden: category?.orden || "",
        activo: category?.activo ?? true,
    });
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!category);
    const { showToast } = useToast();
    const router = useRouter();

    // Auto-generar slug desde nombre
    useEffect(() => {
        if (!slugManuallyEdited && formData.nombre) {
            const autoSlug = formData.nombre
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Remover acentos
                .replace(/[^a-z0-9]+/g, "-") // Reemplazar espacios y caracteres especiales con guiones
                .replace(/^-+|-+$/g, ""); // Remover guiones al inicio y final

            setFormData(prev => ({ ...prev, slug: autoSlug }));
        }
    }, [formData.nombre, slugManuallyEdited]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "slug") {
            setSlugManuallyEdited(true);
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validaciones
        if (!formData.nombre.trim()) {
            showToast("El nombre es requerido", "error");
            return;
        }

        if (!formData.slug.trim()) {
            showToast("El slug es requerido", "error");
            return;
        }

        if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            showToast("El slug solo puede contener letras minúsculas, números y guiones", "error");
            return;
        }

        // Preparar datos
        const data = {
            nombre: formData.nombre.trim(),
            icono: formData.icono,
            slug: formData.slug.trim(),
            descripcion: formData.descripcion.trim() || null,
            orden: formData.orden ? parseInt(formData.orden) : null,
            activo: formData.activo
        };

        onSubmit(data);
    };

    // Iconos disponibles (selección curada)
    const availableIcons = [
        "Tag", "UtensilsCrossed", "Car", "Laptop", "Microwave", "Shirt",
        "Dumbbell", "Wrench", "Armchair", "Dog", "Home", "Package",
        "ShoppingBag", "Book", "Music", "Gamepad", "Baby", "Heart",
        "Briefcase", "Hammer", "Paintbrush", "Camera", "Coffee", "Pizza",
        "Apple", "Bike", "Bus", "Plane", "Train", "Trophy", "Gift",
        "Star", "Sun", "Moon", "Cloud", "Zap", "Flame", "Droplet"
    ];

    const getIcon = (iconName) => {
        const Icon = LucideIcons[iconName];
        return Icon || LucideIcons.Tag;
    };

    const PreviewIcon = getIcon(formData.icono);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="admin-surface rounded-xl border admin-border p-6 space-y-6">
                <h3 className="text-lg font-semibold admin-text pb-2 border-b admin-border">
                    Información Básica
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium admin-text">
                            Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Comida"
                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium admin-text">
                            Slug <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            placeholder="ej: comida"
                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
                            required
                            pattern="[a-z0-9-]+"
                            title="Solo letras minúsculas, números y guiones"
                        />
                        <p className="text-xs admin-text-muted">
                            Solo letras minúsculas, números y guiones
                        </p>
                    </div>
                </div>

                {/* Icono */}
                <div className="space-y-2">
                    <label className="text-sm font-medium admin-text">
                        Icono <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                        <select
                            name="icono"
                            value={formData.icono}
                            onChange={handleChange}
                            className="flex-1 px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                        >
                            {availableIcons.map(icon => (
                                <option key={icon} value={icon}>{icon}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2 px-4 py-2 border admin-border rounded-lg admin-bg">
                            <span className="text-sm admin-text-muted">Preview:</span>
                            <PreviewIcon size={24} className="text-primary-600" />
                        </div>
                    </div>
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                    <label className="text-sm font-medium admin-text">Descripción</label>
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Descripción breve de la categoría"
                        className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                    />
                </div>

                {/* Orden */}
                <div className="space-y-2">
                    <label className="text-sm font-medium admin-text">Orden de Visualización</label>
                    <input
                        type="number"
                        name="orden"
                        value={formData.orden}
                        onChange={handleChange}
                        placeholder="1"
                        min="1"
                        className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    <p className="text-xs admin-text-muted">
                        Las categorías se ordenan de menor a mayor
                    </p>
                </div>

                {/* Estado */}
                <div className="space-y-2">
                    <label className="text-sm font-medium admin-text">Estado</label>
                    <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="activo"
                                checked={formData.activo}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 border-2 admin-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-gray-600 dark:after:border-gray-400 after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-primary-600 peer-checked:border-primary-600"></div>
                            <span className="ml-3 text-sm font-medium admin-text">
                                {formData.activo ? "Activa" : "Inactiva"}
                            </span>
                        </label>
                    </div>
                    <p className="text-xs admin-text-muted">
                        Las categorías inactivas no se mostrarán en el formulario de anuncios
                    </p>
                </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    disabled={loading}
                >
                    <X size={20} />
                    Cancelar
                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    <Save size={20} />
                    <span>{loading ? "Guardando..." : (category ? "Guardar Cambios" : "Crear Categoría")}</span>
                </button>
            </div>
        </form>
    );
}
