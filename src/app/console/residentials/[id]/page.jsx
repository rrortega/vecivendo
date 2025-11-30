"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Trash2, Plus, X, ExternalLink } from "lucide-react";
import { Query } from "appwrite";

// Dynamically import map to avoid SSR issues
const LocationPicker = dynamic(() => import("@/components/console/LocationPicker"), {
    ssr: false,
    loading: () => <div className="w-full h-[500px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">Cargando mapa...</div>
});

export default function ResidentialDetailPage({ params }) {
    const { id } = params;
    const router = useRouter();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState("config");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const [formData, setFormData] = useState({
        nombre: "",
        slug: "",
        direccion: "",
        country: "MX",
        phone_prefix: "52",
        ubicacion_centro_lat: 0,
        ubicacion_centro_lng: 0,
        radio_autorizado_metros: 500,
        grupos_whatsapp: [], // Array of objects
    });
    const [isDirty, setIsDirty] = useState(false);

    // State for new group input
    const [newGroup, setNewGroup] = useState({ name: "", wspp_id: "" });
    const [addingGroup, setAddingGroup] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "residenciales";
    const groupsCollectionId = "grupos_whatsapp"; // Assumed based on field name

    useEffect(() => {
        if (id === "new") {
            setLoading(false);
            setInitialData(formData);
        } else {
            fetchData();
        }
    }, [id]);

    useEffect(() => {
        if (initialData) {
            // Simple comparison for dirty check (ignoring array order/deep diff for now to keep it simple, or use JSON.stringify)
            // We need to be careful with the array of objects.
            const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
            setIsDirty(hasChanges);
        }
    }, [formData, initialData]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const doc = await databases.getDocument(dbId, collectionId, id);
            const data = {
                nombre: doc.nombre || "",
                slug: doc.slug || "",
                direccion: doc.direccion || "",
                country: doc.country || "MX",
                phone_prefix: doc.phone_prefix || "52",
                ubicacion_centro_lat: doc.ubicacion_centro_lat || 0,
                ubicacion_centro_lng: doc.ubicacion_centro_lng || 0,
                radio_autorizado_metros: doc.radio_autorizado_metros || 500,
                grupos_whatsapp: doc.grupos_whatsapp || [],
            };
            setFormData(data);
            setInitialData(data);
        } catch (error) {
            console.error("Error fetching residential:", error);
            showToast("Error al cargar el residencial", "error");
            router.push("/console/residentials");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationChange = ({ lat, lng, radius }) => {
        setFormData(prev => ({
            ...prev,
            ubicacion_centro_lat: lat,
            ubicacion_centro_lng: lng,
            radio_autorizado_metros: radius
        }));
    };

    const handleAddGroup = async () => {
        if (!newGroup.name || !newGroup.wspp_id) {
            showToast("Completa el nombre y el ID de WhatsApp", "error");
            return;
        }

        try {
            setAddingGroup(true);
            // 1. Create the group in the groups collection
            const groupResponse = await databases.createDocument(dbId, groupsCollectionId, 'unique()', {
                name: newGroup.name,
                wspp_id: newGroup.wspp_id,
            });

            // 2. Associate with Residential immediately
            // Prepare current groups IDs + new group ID
            const currentGroupIds = formData.grupos_whatsapp.map(g => g.$id);
            const updatedGroupIds = [...currentGroupIds, groupResponse.$id];

            const payload = {
                ...formData,
                grupos_whatsapp: updatedGroupIds
            };

            await databases.updateDocument(dbId, collectionId, id, payload);

            // 3. Update local state
            const updatedGroupsList = [...formData.grupos_whatsapp, groupResponse];
            const newFormData = {
                ...formData,
                grupos_whatsapp: updatedGroupsList
            };

            setFormData(newFormData);
            setInitialData(newFormData); // Sync initialData to avoid unsaved changes warning

            setNewGroup({ name: "", wspp_id: "" });
            setShowGroupModal(false);
            showToast("Grupo creado y asociado correctamente", "success");
        } catch (error) {
            console.error("Error creating/linking group:", error);
            showToast("Error al guardar el grupo. Verifica permisos o conexión.", "error");
        } finally {
            setAddingGroup(false);
        }
    };

    const handleRemoveGroup = (groupId) => {
        // Just remove from the list. The actual document remains in the groups collection (orphan).
        // Or should we delete it? Usually removing from relation just unlinks it.
        // User said "agregar los grupos...".
        const updatedGroups = formData.grupos_whatsapp.filter(g => g.$id !== groupId);
        setFormData(prev => ({
            ...prev,
            grupos_whatsapp: updatedGroups
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Prepare payload: map groups to IDs
            const payload = {
                ...formData,
                grupos_whatsapp: formData.grupos_whatsapp.map(g => g.$id)
            };

            if (id === "new") {
                const response = await databases.createDocument(dbId, collectionId, 'unique()', payload);
                showToast("Residencial creado correctamente", "success");
                router.push(`/console/residentials/${response.$id}`);
            } else {
                await databases.updateDocument(dbId, collectionId, id, payload);
                showToast("Residencial actualizado correctamente", "success");
                setInitialData(formData);
                setIsDirty(false);
            }
        } catch (error) {
            console.error("Error saving residential:", error);
            showToast("Error al guardar residencial", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm(`¿Estás seguro de eliminar el residencial ${formData.nombre}?`)) {
            try {
                await databases.deleteDocument(dbId, collectionId, id);
                showToast("Residencial eliminado correctamente", "success");
                router.push("/console/residentials");
            } catch (error) {
                console.error("Error deleting residential:", error);
                showToast("Error al eliminar residencial", "error");
            }
        }
    };

    const handleReset = () => {
        if (initialData) {
            setFormData(initialData);
            setIsDirty(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/console/residentials")}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {id === "new" ? "Nuevo Residencial" : formData.nombre}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {id === "new" ? "Crea un nuevo residencial" : "Administra los detalles y ubicación"}
                        </p>
                    </div>
                </div>

                {id !== "new" && (
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <Trash2 size={20} />
                        Eliminar Residencial
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("config")}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "config"
                            ? "border-primary-500 text-primary-600 dark:text-primary-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        Configuración
                    </button>
                    <button
                        onClick={() => setActiveTab("map")}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "map"
                            ? "border-primary-500 text-primary-600 dark:text-primary-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        Mapa y Ubicación
                    </button>
                </nav>
            </div>

            <form id="residential-form" onSubmit={handleSubmit} className="space-y-8">
                {activeTab === "config" && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div className="col-span-2">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información Básica</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Nombre del Residencial
                                        </label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Slug (URL amigable)
                                        </label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Dirección Completa
                                        </label>
                                        <input
                                            type="text"
                                            name="direccion"
                                            value={formData.direccion}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Integration */}
                            <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Integración y Contacto</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            País (Código)
                                        </label>
                                        <input
                                            type="text"
                                            name="country"
                                            value={formData.country}
                                            onChange={handleChange}
                                            maxLength={2}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Prefijo Telefónico
                                        </label>
                                        <input
                                            type="text"
                                            name="phone_prefix"
                                            value={formData.phone_prefix}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* WhatsApp Groups Section */}
                            <div className="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Grupos de WhatsApp</h3>

                                <div className="space-y-4">
                                    {/* List of existing groups */}
                                    {formData.grupos_whatsapp.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {formData.grupos_whatsapp.map((group, index) => (
                                                <div key={group.$id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">{group.name || group.nombre || "Grupo sin nombre"}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                            ID: {group.wspp_id || "Sin ID"}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveGroup(group.$id)}
                                                        className="text-red-500 hover:text-red-700 p-2"
                                                        title="Quitar grupo"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No hay grupos asociados.</p>
                                    )}

                                    {/* Add New Group Button */}
                                    {id !== "new" ? (
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowGroupModal(true)} // Reusing addingGroup state to show modal? No, let's use a new state
                                                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                                            >
                                                <Plus size={20} />
                                                Agregar Grupo de WhatsApp
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                                            Guarda el residencial primero para poder agregar grupos de WhatsApp.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "map" && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="mb-4 flex justify-between items-end">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ubicación y Perímetro</h3>
                                <p className="text-sm text-gray-500">Arrastra el marcador para definir el centro. Ajusta el radio para el perímetro permitido.</p>
                            </div>
                            <div className="w-48">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Radio (metros)
                                </label>
                                <input
                                    type="number"
                                    name="radio_autorizado_metros"
                                    value={formData.radio_autorizado_metros}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>

                        <LocationPicker
                            lat={formData.ubicacion_centro_lat}
                            lng={formData.ubicacion_centro_lng}
                            radius={Number(formData.radio_autorizado_metros)}
                            onChange={handleLocationChange}
                        />

                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500">
                            <div>Latitud: {formData.ubicacion_centro_lat.toFixed(6)}</div>
                            <div>Longitud: {formData.ubicacion_centro_lng.toFixed(6)}</div>
                        </div>
                    </div>
                )}
            </form>

            {/* Bottom Save Bar */}
            <div className={`fixed bottom-0 right-0 left-64 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg transform transition-transform duration-300 flex justify-between items-center z-40 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}>
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
                        type="submit"
                        form="residential-form"
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

            {/* Add Group Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agregar Grupo de WhatsApp</h3>
                            <button onClick={() => setShowGroupModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre del Grupo
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Vecinos Vigilantes"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    WhatsApp ID (wspp_id)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. 12036304..."
                                    value={newGroup.wspp_id}
                                    onChange={(e) => setNewGroup(prev => ({ ...prev, wspp_id: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowGroupModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddGroup}
                                    disabled={addingGroup}
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {addingGroup ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
