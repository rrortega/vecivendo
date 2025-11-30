"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/context/ToastContext";

export default function ConfigurationsPage() {
    const [config, setConfig] = useState({
        whatsapp_asistencia: "",
        email_soporte: "",
        facebook_link: "",
        instagram_link: "",
        twitter_link: "",
        linkedin_link: "",
    });
    const [initialConfig, setInitialConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [docId, setDocId] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    const { showToast } = useToast() || { showToast: (msg, type) => alert(msg) };

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "configuracion_global";

    useEffect(() => {
        fetchConfig();
    }, []);

    // Check for changes whenever config updates
    useEffect(() => {
        if (initialConfig) {
            const hasChanges = JSON.stringify(config) !== JSON.stringify(initialConfig);
            setIsDirty(hasChanges);
        }
    }, [config, initialConfig]);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await databases.listDocuments(dbId, collectionId, [
                Query.limit(1)
            ]);

            if (response.documents.length > 0) {
                const doc = response.documents[0];
                setDocId(doc.$id);
                const fetchedConfig = {
                    whatsapp_asistencia: doc.whatsapp_asistencia || "",
                    email_soporte: doc.email_soporte || "",
                    facebook_link: doc.facebook_link || "",
                    instagram_link: doc.instagram_link || "",
                    twitter_link: doc.twitter_link || "",
                    linkedin_link: doc.linkedin_link || "",
                };
                setConfig(fetchedConfig);
                setInitialConfig(fetchedConfig);
            }
        } catch (error) {
            console.error("Error fetching config:", error);
            showToast("Error al cargar la configuración", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (docId) {
                await databases.updateDocument(dbId, collectionId, docId, config);
                showToast("Configuración actualizada correctamente", "success");
            } else {
                const response = await databases.createDocument(dbId, collectionId, 'unique()', config);
                setDocId(response.$id);
                showToast("Configuración creada correctamente", "success");
            }
            setInitialConfig(config); // Update initial config to current
            setIsDirty(false);
        } catch (error) {
            console.error("Error saving config:", error);
            showToast("Error al guardar la configuración", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (initialConfig) {
            setConfig(initialConfig);
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
        <div className="max-w-4xl mx-auto pb-24">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración Global</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Administra los datos de contacto y redes sociales de la plataforma.
                </p>
            </div>

            <form id="config-form" onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-8">

                {/* Contact Info Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Datos de Contacto
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Soporte
                            </label>
                            <input
                                type="email"
                                name="email_soporte"
                                value={config.email_soporte}
                                onChange={handleChange}
                                placeholder="soporte@vecivendo.com"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                            />
                            <p className="text-xs text-gray-500 mt-1">Debe ser un correo electrónico válido.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                WhatsApp Asistencia (Celular)
                            </label>
                            <input
                                type="tel"
                                name="whatsapp_asistencia"
                                value={config.whatsapp_asistencia}
                                onChange={handleChange}
                                placeholder="5215555555555"
                                pattern="[0-9]{10,15}"
                                required
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                            />
                            <p className="text-xs text-gray-500 mt-1">Solo números, entre 10 y 15 dígitos (incluyendo código de país).</p>
                        </div>
                    </div>
                </div>

                {/* Social Media Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                        Redes Sociales
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Facebook
                            </label>
                            <input
                                type="url"
                                name="facebook_link"
                                value={config.facebook_link}
                                onChange={handleChange}
                                placeholder="https://facebook.com/..."
                                pattern="https?://.+"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Instagram
                            </label>
                            <input
                                type="url"
                                name="instagram_link"
                                value={config.instagram_link}
                                onChange={handleChange}
                                placeholder="https://instagram.com/..."
                                pattern="https?://.+"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Twitter (X)
                            </label>
                            <input
                                type="url"
                                name="twitter_link"
                                value={config.twitter_link}
                                onChange={handleChange}
                                placeholder="https://twitter.com/..."
                                pattern="https?://.+"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                LinkedIn
                            </label>
                            <input
                                type="url"
                                name="linkedin_link"
                                value={config.linkedin_link}
                                onChange={handleChange}
                                placeholder="https://linkedin.com/..."
                                pattern="https?://.+"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                            />
                        </div>
                    </div>
                </div>
            </form>

            {/* Conditional Bottom Bar */}
            <div className={`fixed bottom-0 right-0 left-64 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg transform transition-transform duration-300 flex justify-between items-center z-50 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}>
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
                        form="config-form"
                        disabled={saving}
                        className={`px-6 py-2 rounded-lg text-white font-medium transition-all ${saving
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-black hover:bg-gray-800"
                            }`}
                    >
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}
