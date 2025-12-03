
"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Plus, Save, Trash2, Edit2, X, MapPin, Phone, Mail, Globe, Calendar, ArrowLeft, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { countries } from "@/utils/countries";

const LocationPicker = dynamic(() => import("@/components/console/LocationPicker"), { ssr: false });

export default function ResidentialDetailPage({ params }) {
    const { id } = params;
    const router = useRouter();
    const { showToast } = useToast();

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "residenciales";

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletedGroups, setDeletedGroups] = useState([]); // Track deleted groups
    const [activeTab, setActiveTab] = useState("config");
    const [isDirty, setIsDirty] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [addingGroup, setAddingGroup] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: "", wspp_id: "" });
    const [initialData, setInitialData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [deleting, setDeleting] = useState(false);

    // Notices State
    const [avisosList, setAvisosList] = useState([]);
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [newNotice, setNewNotice] = useState({ title: "", content: "", duration: 3 });
    const [editingNoticeId, setEditingNoticeId] = useState(null);

    const [formData, setFormData] = useState({
        nombre: "",
        slug: "",
        direccion: "",
        ciudad: "",
        provincia_estado: "",
        codigo_postal: "",
        country: "MX",
        moneda: "MXN",
        phone_prefix: "52",
        ubicacion_centro_lat: 0,
        ubicacion_centro_lng: 0,
        radio_autorizado_metros: 500,
        grupos_whatsapp: [],
        active: true,
    });

    // ...

    const fetchData = async () => {
        try {
            setLoading(true);
            const doc = await databases.getDocument(dbId, collectionId, id);
            const data = {
                nombre: doc.nombre || "",
                slug: doc.slug || "",
                direccion: doc.direccion || "",
                ciudad: doc.ciudad || "",
                provincia_estado: doc.provincia_estado || "",
                codigo_postal: doc.codigo_postal || "",
                country: doc.country || "MX",
                moneda: doc.moneda || "MXN",
                phone_prefix: doc.phone_prefix || "52",
                ubicacion_centro_lat: doc.ubicacion_centro_lat || 0,
                ubicacion_centro_lng: doc.ubicacion_centro_lng || 0,
                radio_autorizado_metros: doc.radio_autorizado_metros || 500,
                grupos_whatsapp: doc.grupos_whatsapp ? doc.grupos_whatsapp.map(g => ({
                    $id: g.$id,
                    name: g.nombre_grupo,
                    wspp_id: g.whatsapp_group_id
                })) : [],
                active: doc.active ?? true,
            };
            setFormData(data);
            setInitialData(data);

            // Fetch Avisos
            try {
                const avisosResponse = await databases.listDocuments(
                    dbId,
                    "avisos_comunidad",
                    [Query.equal("residencial", id)]
                );
                setAvisosList(avisosResponse.documents.map(doc => ({
                    $id: doc.$id,
                    title: doc.titulo,
                    content: doc.contenido,
                    duration: doc.duracion_dias || 3,
                    createdAt: new Date(doc.$createdAt).toLocaleDateString()
                })));
            } catch (error) {
                console.error("Error fetching avisos:", error);
                // Don't block main data load if avisos fail
            }

        } catch (error) {
            console.error("Error fetching residential:", error);
            showToast("Error al cargar el residencial", "error");
            router.push("/console/residentials");
        } finally {
            setLoading(false);
        }
    };

    const handleCountryChange = (e) => {
        const countryCode = e.target.value;
        const countryData = countries[countryCode];

        setFormData(prev => ({
            ...prev,
            country: countryCode,
            moneda: countryData?.currency || "",
            phone_prefix: countryData?.prefix || "",
            provincia_estado: "", // Reset state when country changes
        }));
    };

    useEffect(() => {
        if (id && id !== "new") {
            fetchData();
        }
    }, [id]);

    useEffect(() => {
        if (initialData) {
            const isChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
            setIsDirty(isChanged);
        }
    }, [formData, initialData]);

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

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);

        try {
            let residentialId = id;

            // 1. Si es nuevo residencial, crearlo primero sin grupos
            if (id === "new") {
                const payload = {
                    ...formData,
                    ubicacion_centro_lat: parseFloat(formData.ubicacion_centro_lat),
                    ubicacion_centro_lng: parseFloat(formData.ubicacion_centro_lng),
                    radio_autorizado_metros: parseFloat(formData.radio_autorizado_metros),
                    active: Boolean(formData.active),
                    grupos_whatsapp: [] // No asignar grupos todavía
                };

                const response = await databases.createDocument(dbId, collectionId, "unique()", payload);
                residentialId = response.$id;
            } else {
                // Si ya existe, actualizar datos básicos primero
                const payload = {
                    ...formData,
                    ubicacion_centro_lat: parseFloat(formData.ubicacion_centro_lat),
                    ubicacion_centro_lng: parseFloat(formData.ubicacion_centro_lng),
                    radio_autorizado_metros: parseFloat(formData.radio_autorizado_metros),
                    active: Boolean(formData.active),
                    // No pasamos grupos_whatsapp aquí para evitar el error 500 si hay conflicto
                    // Lo manejaremos actualizando los grupos directamente
                };
                delete payload.grupos_whatsapp; // Asegurar que no se envía

                await databases.updateDocument(dbId, collectionId, id, payload);
            }

            // 2. Eliminar grupos marcados para borrado
            if (deletedGroups.length > 0) {
                await Promise.all(deletedGroups.map(async (groupId) => {
                    try {
                        await databases.deleteDocument(dbId, 'grupos_whatsapp', groupId);
                        console.log(`Group ${groupId} deleted`);
                    } catch (err) {
                        console.error(`Error deleting group ${groupId}:`, err);
                    }
                }));
            }

            // 3. Procesar y vincular grupos de WhatsApp (Crear/Actualizar)
            await Promise.all(formData.grupos_whatsapp.map(async (g) => {
                const groupPayload = {
                    nombre_grupo: g.name,
                    whatsapp_group_id: g.wspp_id,
                    residencial: residentialId // Vincular directamente al residencial
                };

                try {
                    if (!g.$id || g.$id === 'unique()' || g.$id.length < 10) {
                        // Crear nuevo grupo vinculado
                        await databases.createDocument(dbId, 'grupos_whatsapp', 'unique()', groupPayload);
                    } else {
                        // Actualizar grupo existente y asegurar vínculo
                        await databases.updateDocument(dbId, 'grupos_whatsapp', g.$id, groupPayload);
                    }
                } catch (err) {
                    console.error("Error processing group:", g, err);
                    // No lanzar error para no interrumpir el flujo principal, pero loguear
                }
            }));

            showToast(id === "new" ? "Residencial creado exitosamente" : "Cambios guardados exitosamente", "success");

            if (id === "new") {
                router.push(`/console/residentials/${residentialId}`);
            } else {
                setInitialData(formData);
                setIsDirty(false);
                // Recargar datos para ver los grupos vinculados correctamente
                fetchData();
            }

        } catch (error) {
            console.error("Error saving residential:", error);
            showToast(`Error al guardar: ${error.message}`, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (deleteConfirmation !== `Eliminar permanentemente el residencial ${formData.nombre}`) return;

        setDeleting(true);
        try {
            await databases.deleteDocument(dbId, collectionId, id);
            showToast("Residencial eliminado", "success");
            router.push("/console/residentials");
        } catch (error) {
            console.error("Error deleting residential:", error);
            showToast(`Error al eliminar: ${error.message}`, "error");
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleReset = () => {
        if (initialData) setFormData(initialData);
    };

    const handleAddGroup = () => {
        setFormData(prev => ({
            ...prev,
            grupos_whatsapp: [...prev.grupos_whatsapp, { ...newGroup, $id: "unique()" }]
        }));
        setShowGroupModal(false);
        setNewGroup({ name: "", wspp_id: "" });
    };

    const removeGroup = (index) => {
        setFormData(prev => {
            const groupToRemove = prev.grupos_whatsapp[index];
            // If group has a valid ID (not new/temp), add to deletedGroups
            if (groupToRemove.$id && groupToRemove.$id !== 'unique()' && groupToRemove.$id.length > 10) {
                setDeletedGroups(prevDeleted => [...prevDeleted, groupToRemove.$id]);
            }

            return {
                ...prev,
                grupos_whatsapp: prev.grupos_whatsapp.filter((_, i) => i !== index)
            };
        });
    };

    // Notices Handlers
    const handleAddNotice = () => {
        setNewNotice({ title: "", content: "", duration: 3 });
        setEditingNoticeId(null);
        setShowNoticeModal(true);
    };

    const handleEditNotice = (aviso) => {
        setNewNotice({ title: aviso.title, content: aviso.content, duration: aviso.duration });
        setEditingNoticeId(aviso.$id);
        setShowNoticeModal(true);
    };

    const handleSaveNotice = async () => {
        console.log("Entering handleSaveNotice");
        setSaving(true);
        try {
            const payload = {
                titulo: newNotice.title,
                contenido: newNotice.content,
                duracion_dias: parseInt(newNotice.duration),
                residencial: id
            };

            console.log("Saving notice payload:", payload);
            if (editingNoticeId) {
                // Edit existing
                await databases.updateDocument(dbId, "avisos_comunidad", editingNoticeId, payload);
                setAvisosList(prev => prev.map(a => a.$id === editingNoticeId ? { ...a, ...newNotice } : a));
                showToast("Aviso actualizado", "success");
            } else {
                // Add new
                const response = await databases.createDocument(dbId, "avisos_comunidad", "unique()", payload);
                console.log("Create notice response:", response);
                setAvisosList(prev => [...prev, { ...newNotice, $id: response.$id }]);
                showToast("Aviso creado", "success");
            }
            setShowNoticeModal(false);
        } catch (error) {
            console.error("Error saving notice:", error);
            console.log("Full error object:", JSON.stringify(error, null, 2));
            showToast(`Error al guardar aviso: ${error.message}`, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteNotice = async (noticeId) => {
        if (confirm("¿Estás seguro de eliminar este aviso?")) {
            try {
                await databases.deleteDocument(dbId, "avisos_comunidad", noticeId);
                setAvisosList(prev => prev.filter(a => a.$id !== noticeId));
                showToast("Aviso eliminado", "success");
            } catch (error) {
                console.error("Error deleting notice:", error);
                showToast(`Error al eliminar aviso: ${error.message}`, "error");
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/console/residentials")}
                        className="p-2 admin-hover rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold admin-text">
                            {id === "new" ? "Nuevo Residencial" : formData.nombre}
                        </h1>
                        <p className="text-sm admin-text-muted">
                            {id === "new" ? "Crea un nuevo residencial" : "Administra los detalles y ubicación"}
                        </p>
                    </div>
                </div>


            </div>

            {/* Tabs */}
            <div className="border-b admin-border mb-6 overflow-x-auto scrollbar-hide">
                <nav className="-mb-px flex space-x-8 min-w-max px-1">
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
                    <button
                        onClick={() => setActiveTab("whatsapp")}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "whatsapp"
                            ? "border-primary-500 text-primary-600 dark:text-primary-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        Grupos de WhatsApp
                    </button>
                    <button
                        onClick={() => setActiveTab("avisos")}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "avisos"
                            ? "border-primary-500 text-primary-600 dark:text-primary-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        Avisos
                    </button>
                </nav>
            </div>

            <form id="residential-form" onSubmit={handleSubmit} className="space-y-8">
                {activeTab === "config" && (
                    <div className="admin-surface rounded-xl shadow-sm border admin-border p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div className="col-span-2">
                                <h3 className="text-lg font-medium admin-text mb-4">Información Básica</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Nombre del Residencial
                                        </label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Slug (URL amigable)
                                        </label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location & Address */}
                            <div className="col-span-2 border-t admin-border pt-6">
                                <h3 className="text-lg font-medium admin-text mb-4">Ubicación y Dirección</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            País
                                        </label>
                                        <select
                                            name="country"
                                            value={formData.country}
                                            onChange={handleCountryChange}
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        >
                                            {Object.entries(countries).map(([code, data]) => (
                                                <option key={code} value={code}>
                                                    {data.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Estado / Provincia
                                        </label>
                                        <select
                                            name="provincia_estado"
                                            value={formData.provincia_estado}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        >
                                            <option value="">Selecciona...</option>
                                            {countries[formData.country]?.states.map((state) => (
                                                <option key={state} value={state}>
                                                    {state}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Ciudad
                                        </label>
                                        <input
                                            type="text"
                                            name="ciudad"
                                            value={formData.ciudad}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Código Postal
                                        </label>
                                        <input
                                            type="text"
                                            name="codigo_postal"
                                            value={formData.codigo_postal}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Dirección (Calle, Número, Colonia)
                                        </label>
                                        <input
                                            type="text"
                                            name="direccion"
                                            value={formData.direccion}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Regional Settings */}
                            <div className="col-span-2 border-t admin-border pt-6">
                                <h3 className="text-lg font-medium admin-text mb-4">Configuración Regional</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Moneda
                                        </label>
                                        <input
                                            type="text"
                                            name="moneda"
                                            value={formData.moneda}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Prefijo Telefónico
                                        </label>
                                        <input
                                            type="text"
                                            name="phone_prefix"
                                            value={formData.phone_prefix}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>



                        </div>
                    </div>
                )}

                {activeTab === "config" && id !== "new" && (
                    <div className=" rounded-xl shadow-sm border border-red-200   overflow-hidden">
                        <div className="px-6 py-4 bg-red-500/10   border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
                            <AlertTriangle className="text-red-600" size={20} />
                            <h3 className="text-lg font-medium text-red-900  ">Zona de Peligro</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-red-50/10 border border-red-100/20">
                                <div>
                                    <h4 className="text-sm font-medium text-red-600 ">Estado del Residencial</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Desactiva el residencial para ocultarlo temporalmente sin eliminar sus datos.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-medium ${formData.active ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                        {formData.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${formData.active ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                            }`}
                                    >
                                        <span
                                            className={`${formData.active ? 'translate-x-6' : 'translate-x-1'
                                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-red-50/10 border border-red-100/20  ">
                                <div>
                                    <h4 className="text-sm font-medium text-red-600">Eliminar Residencial</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el residencial y todos sus datos asociados.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "map" && (
                    <div className="admin-surface rounded-xl shadow-sm border admin-border p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-medium admin-text">Ubicación y Perímetro</h3>
                            <p className="text-sm text-gray-500">Arrastra el marcador para definir el centro o ingresa las coordenadas manualmente.</p>
                        </div>

                        <LocationPicker
                            lat={formData.ubicacion_centro_lat}
                            lng={formData.ubicacion_centro_lng}
                            radius={Number(formData.radio_autorizado_metros)}
                            onChange={handleLocationChange}
                        />

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium admin-text mb-1">
                                    Latitud
                                </label>
                                <input
                                    type="number"
                                    name="ubicacion_centro_lat"
                                    value={formData.ubicacion_centro_lat}
                                    onChange={(e) => handleChange({ target: { name: 'ubicacion_centro_lat', value: parseFloat(e.target.value) || 0 } })}
                                    step="any"
                                    className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium admin-text mb-1">
                                    Longitud
                                </label>
                                <input
                                    type="number"
                                    name="ubicacion_centro_lng"
                                    value={formData.ubicacion_centro_lng}
                                    onChange={(e) => handleChange({ target: { name: 'ubicacion_centro_lng', value: parseFloat(e.target.value) || 0 } })}
                                    step="any"
                                    className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium admin-text mb-1">
                                    Radio (metros)
                                </label>
                                <input
                                    type="number"
                                    name="radio_autorizado_metros"
                                    value={formData.radio_autorizado_metros}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === "whatsapp" && (
                    <div className="admin-surface rounded-xl shadow-sm border admin-border p-6">
                        <h3 className="text-lg font-medium admin-text mb-4">Grupos de WhatsApp</h3>
                        <p className="text-sm admin-text-muted mb-6">
                            Gestiona los grupos de WhatsApp asociados a este residencial.
                        </p>

                        <div className="space-y-4">
                            {/* List of existing groups */}
                            {formData.grupos_whatsapp.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {formData.grupos_whatsapp.map((group, index) => (
                                        <div key={group.$id || index} className="flex items-center justify-between p-3  rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <div>
                                                <div className="font-medium admin-text">{group.name || group.nombre || "Grupo sin nombre"}</div>
                                                <div className="text-xs admin-text-muted flex items-center gap-1">
                                                    ID: {group.wspp_id || "Sin ID"}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeGroup(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No hay grupos asociados.</p>
                            )}

                            {/* Add New Group Tile */}
                            {id !== "new" ? (
                                <button
                                    type="button"
                                    onClick={() => setShowGroupModal(true)}
                                    className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-600 transition-all group cursor-pointer"
                                >
                                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-2 group-hover:bg-gray-200 dark:group-hover:bg-gray-500 transition-colors">
                                        <Plus size={24} />
                                    </div>
                                    <span className="font-medium">Agregar Grupo de WhatsApp</span>
                                </button>
                            ) : (
                                <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm text-center">
                                    Guarda el residencial primero para poder agregar grupos de WhatsApp.
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === "avisos" && (
                    <div className="admin-surface rounded-xl shadow-sm border admin-border p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-medium admin-text">Avisos Comunitarios</h3>
                                <p className="text-sm admin-text-muted">
                                    Publica anuncios importantes para los residentes.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {avisosList.length > 0 && (
                                <div className="grid grid-cols-1 gap-4">
                                    {avisosList.map((aviso) => (
                                        <div key={aviso.$id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border admin-border relative group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold admin-text">{aviso.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs admin-text-muted flex items-center gap-1 admin-surface px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                                                        <Calendar size={12} />
                                                        {aviso.createdAt} ({aviso.duration} días)
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditNotice(aviso)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteNotice(aviso.$id)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{aviso.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Notice Tile */}
                            <button
                                type="button"
                                onClick={handleAddNotice}
                                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-600 transition-all group cursor-pointer"
                            >
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-2 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                                    <Plus size={24} />
                                </div>
                                <span className="font-medium">Crear Nuevo Aviso</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Add Group Modal */}
                <AnimatePresence>
                    {showGroupModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-end justify-center md:items-center z-50 p-0 md:p-4"
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 500 }}
                                className="bg-surface w-full md:max-w-md rounded-t-xl rounded-b-none md:rounded-xl shadow-xl p-6 mb-0 md:mb-auto border border-gray-200 dark:border-gray-700"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold admin-text dark:text-white">Agregar Grupo de WhatsApp</h3>
                                    <button onClick={() => setShowGroupModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Nombre del Grupo
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Vecinos Vigilantes"
                                            value={newGroup.name}
                                            onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            WhatsApp ID (wspp_id)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej. 12036304..."
                                            value={newGroup.wspp_id}
                                            onChange={(e) => setNewGroup(prev => ({ ...prev, wspp_id: e.target.value }))}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>

                                    <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowGroupModal(false)}
                                            className="w-full md:w-auto px-4 py-2   hover:bg-surface  rounded-lg transition-colors text-center"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddGroup}
                                            disabled={addingGroup}
                                            className="w-full md:w-auto bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Save size={20} />
                                            {addingGroup ? "Guardando..." : "Guardar"}
                                        </button>
                                    </div>
                                </div>

                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notice Modal */}
                <AnimatePresence>
                    {showNoticeModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-end justify-center md:items-center z-50 p-0 md:p-4"
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 500 }}
                                className="admin-surface w-full md:max-w-md rounded-t-xl rounded-b-none md:rounded-xl shadow-xl p-6 mb-0 md:mb-auto"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold admin-text">
                                        {editingNoticeId ? "Editar Aviso" : "Nuevo Aviso"}
                                    </h3>
                                    <button onClick={() => setShowNoticeModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Título
                                        </label>
                                        <input
                                            type="text"
                                            value={newNotice.title}
                                            onChange={(e) => setNewNotice(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                            placeholder="Ej. Mantenimiento de Alberca"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Duración (días)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={newNotice.duration}
                                            onChange={(e) => setNewNotice({ ...newNotice, duration: parseInt(e.target.value) || 3 })}
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium admin-text mb-1">
                                            Contenido
                                        </label>
                                        <textarea
                                            value={newNotice.content}
                                            onChange={(e) => setNewNotice(prev => ({ ...prev, content: e.target.value }))}
                                            rows={4}
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                            placeholder="Escribe el detalle del aviso..."
                                        />
                                    </div>

                                    <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowNoticeModal(false)}
                                            className="w-full md:w-auto px-4 py-2   hover:bg-surface  rounded-lg transition-colors text-center"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                console.log("Save button clicked");
                                                handleSaveNotice();
                                            }}
                                            className="w-full md:w-auto bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Save size={20} />
                                            {saving ? "Guardando..." : "Guardar"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-end justify-center md:items-center z-50 p-0 md:p-4"
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 500 }}
                                className="admin-surface w-full md:max-w-md rounded-t-xl rounded-b-none md:rounded-xl shadow-xl p-6 mb-0 md:mb-auto"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold admin-text">Eliminar Residencial</h3>
                                    <button onClick={() => setShowDeleteModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
                                        Esta acción es irreversible. Por favor, escribe la siguiente frase para confirmar:
                                        <div className="font-mono font-bold mt-2 select-all">
                                            Eliminar permanentemente el residencial {formData.nombre}
                                        </div>
                                    </div>

                                    <div>
                                        <input
                                            type="text"
                                            value={deleteConfirmation}
                                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                                            placeholder="Escribe la frase de confirmación"
                                            className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-red-500 outline-none"
                                        />
                                    </div>

                                    <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteModal(false)}
                                            className="w-full md:w-auto px-4 py-2   hover:bg-surface  rounded-lg transition-colors text-center"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirmDelete}
                                            disabled={deleteConfirmation !== `Eliminar permanentemente el residencial ${formData.nombre}` || deleting}
                                            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        >
                                            {deleting ? "Eliminando..." : "Eliminar permanentemente"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

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
