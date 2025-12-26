"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { ArrowLeft, Save, Trash2, AlertTriangle } from "lucide-react";
import ConfirmModal from "@/components/console/ConfirmModal";

export default function WhatsAppGroupEditPage({ params }) {
    const { id } = params;
    const router = useRouter();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        nombre_grupo: "",
        whatsapp_group_id: "",
        residencial_nombre: "", // For display only
        residencial_id: "", // For reference
        activo: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "grupos_whatsapp";

    useEffect(() => {
        if (id && id !== "new") {
            fetchData();
        } else {
            setInitialData(formData);
            setLoading(false);
        }
    }, [id]);

    const [initialData, setInitialData] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (initialData) {
            const isChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
            setIsDirty(isChanged);
        }
    }, [formData, initialData]);

    const fetchData = async () => {
        try {
            const doc = await databases.getDocument(dbId, collectionId, id);
            const data = {
                nombre_grupo: doc.nombre_grupo || "",
                whatsapp_group_id: doc.whatsapp_group_id || "",
                residencial_nombre: doc.residencial ? doc.residencial.nombre : "Sin asignar",
                residencial_id: doc.residencial ? doc.residencial.$id : "",
                activo: doc.activo ?? true
            };
            setFormData(data);
            setInitialData(data);
        } catch (error) {
            console.error("Error fetching group:", error);
            showToast("Error al cargar el grupo", "error");
            router.push("/console/whatsapp");
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.nombre_grupo.trim()) {
            newErrors.nombre_grupo = "El nombre es requerido";
        }

        // Validation: 120363301761993156@g.us (digits + @g.us)
        const wsppPattern = /^\d+@g\.us$/;
        if (formData.whatsapp_group_id && !wsppPattern.test(formData.whatsapp_group_id)) {
            newErrors.whatsapp_group_id = "Formato inválido. Debe ser números seguidos de @g.us (ej: 123456@g.us)";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            const payload = {
                nombre_grupo: formData.nombre_grupo,
                whatsapp_group_id: formData.whatsapp_group_id,
                activo: formData.activo
                // Residential is not updated here as per requirements
            };

            if (id === "new") {
                await databases.createDocument(dbId, collectionId, "unique()", payload);
                showToast("Grupo creado exitosamente", "success");
            } else {
                await databases.updateDocument(dbId, collectionId, id, payload);
                showToast("Grupo actualizado exitosamente", "success");
            }
            router.push("/console/whatsapp");
        } catch (error) {
            console.error("Error saving group:", error);
            showToast("Error al guardar el grupo", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            // Try to unlink first if it has a residential to avoid relationship constraints
            if (formData.residencial_id) {
                try {
                    await databases.updateDocument(dbId, collectionId, id, {
                        residencial: null
                    });
                } catch (unlinkError) {
                    console.warn("Could not unlink group before deletion (might be already unlinked or other issue):", unlinkError);
                    // Continue to delete anyway
                }
            }

            await databases.deleteDocument(dbId, collectionId, id);
            showToast("Grupo eliminado exitosamente", "success");
            router.push("/console/whatsapp");
        } catch (error) {
            console.error("Error deleting group:", error);
            showToast("Error al eliminar el grupo", "error");
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Cargando...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto pb-24">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
                </button>
                <h1 className="text-2xl font-bold admin-text">
                    {id === "new" ? "Nuevo Grupo" : "Editar Grupo"}
                </h1>
            </div>

            <form id="whatsapp-group-form" onSubmit={handleSubmit} className="in-surface rounded-xl shadow-sm border admin-border p-6 space-y-6">

                {/* Nombre del Grupo */}
                <div>
                    <label className="text-lg font-medium admin-text mb-4">
                        Nombre del Grupo <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.nombre_grupo}
                        onChange={(e) => setFormData({ ...formData, nombre_grupo: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${errors.nombre_grupo ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                        placeholder="Ej: Vecinos Torre A"
                    />
                    {errors.nombre_grupo && (
                        <p className="mt-1 text-sm text-red-500">{errors.nombre_grupo}</p>
                    )}
                </div>

                {/* WhatsApp Group ID */}
                <div>
                    <label className="text-lg font-medium admin-text mb-4">
                        ID de Grupo WhatsApp
                    </label>
                    <input
                        type="text"
                        value={formData.whatsapp_group_id}
                        onChange={(e) => setFormData({ ...formData, whatsapp_group_id: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${errors.whatsapp_group_id ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                        placeholder="Ej: 120363301761993156@g.us"
                    />
                    {errors.whatsapp_group_id && (
                        <p className="mt-1 text-sm text-red-500">{errors.whatsapp_group_id}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Debe seguir el formato: números seguidos de @g.us
                    </p>
                </div>

                {/* Residencial (Read Only) */}
                <div>
                    <label className="text-lg font-medium admin-text mb-4">
                        Residencial Asignado
                    </label>
                    <input
                        type="text"
                        value={formData.residencial_nombre}
                        disabled
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        El residencial no se puede editar desde aquí.
                    </p>
                </div>
            </form>

            {/* Floating Save Bar */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transform transition-transform duration-300 z-50 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Tienes cambios sin guardar
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData(initialData)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Descartar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Save size={18} />
                            {saving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            {id !== "new" && (

                <div className="mt-8   rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden">
                    <div className="px-6 py-4  bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
                        <AlertTriangle className="text-red-600 " size={20} />
                        <h3 className="font-semibold text-red-800 ">Zona de Peligro</h3>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Toggle Active */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-gray-500  ">Estado del Grupo</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Desactivar el grupo impedirá que se envíen mensajes, pero mantendrá los datos.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, activo: !formData.activo })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${formData.activo ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <span
                                    className={`${formData.activo ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6 flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-gray-500">Eliminar Grupo</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Esta acción es irreversible y eliminará todos los datos del grupo.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(true)}
                                className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors border border-red-200 dark:border-red-800"
                            >
                                Eliminar Grupo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Eliminar Grupo"
                message="¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

        </div>

    );
}
