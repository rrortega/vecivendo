"use client";

import { useState, useEffect, useRef } from "react";
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
        msg_pedido: "",
        msg_review: "",
        msg_solicitud_residencial: "",
        msg_compartir_anuncio: "",
    });
    const [initialConfig, setInitialConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [docId, setDocId] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    const { showToast } = useToast() || { showToast: (msg, type) => alert(msg) };

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "configuracion_global";

    const TEMPLATES = {
        order: {
            id: 'msg_pedido',
            label: 'Mensaje de Pedido',
            description: 'Mensaje enviado al realizar un pedido.',
            variables: ["{name}", "{phone}", "{direccion}", "{calle}", "{manzana}", "{lote}", "{como_llegar}", "{listado}", "{numero_pedido}", "{total}"]
        },
        review: {
            id: 'msg_review',
            label: 'Notificación de Reseña',
            description: 'Mensaje para avisar al anunciante de una nueva reseña.',
            variables: ["{name}", "{review_text}", "{url_anuncio}"]
        },
        landing: {
            id: 'msg_solicitud_residencial',
            label: 'Solicitud Residencial',
            description: 'Mensaje predeterminado para solicitar unirse desde la landing.',
            variables: ["{name}", "{phone}"]
        },
        share: {
            id: 'msg_compartir_anuncio',
            label: 'Compartir Anuncio',
            description: 'Mensaje predeterminado al compartir un anuncio.',
            variables: ["{url_anuncio}"]
        }
    };

    const [activeTemplate, setActiveTemplate] = useState("order");

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
                    msg_pedido: doc.msg_pedido || "",
                    msg_review: doc.msg_review || "",
                    msg_solicitud_residencial: doc.msg_solicitud_residencial || "",
                    msg_compartir_anuncio: doc.msg_compartir_anuncio || "",
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
            if (error.code === 401) {
                showToast("No tienes permisos para guardar la configuración.", "error");
            } else {
                showToast("Error al guardar la configuración", "error");
            }
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

    const textareaRef = useRef(null);

    const insertVariable = (variable) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const currentTemplateKey = TEMPLATES[activeTemplate].id;
        const text = config[currentTemplateKey] || "";

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // If textarea is not focused (or selection is at 0,0 and might not be focused), 
        // we might want to append. But standard behavior for "insert at cursor" 
        // usually implies focusing first if not focused. 
        // If we want to append to end if not focused, we can check document.activeElement

        let newText = "";
        let newCursorPos = 0;

        if (document.activeElement === textarea) {
            const before = text.substring(0, start);
            const after = text.substring(end);
            newText = before + variable + after;
            newCursorPos = start + variable.length;
        } else {
            // Append to end
            newText = text + variable;
            newCursorPos = newText.length;
        }

        setConfig(prev => ({ ...prev, [currentTemplateKey]: newText }));

        // Re-focus and set cursor
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const getPreviewMessage = (template) => {
        if (!template) return "Hola veci...";

        // Mock Data for Preview
        const mockData = {
            name: "Juan Pérez",
            phone: "5512345678",
            direccion: "Av. Principal Mz 10 Lt 5 #23",
            calle: "Av. Principal",
            manzana: "10",
            lote: "5",
            como_llegar: "Casa blanca con portón negro, frente al parque.",
            listado: "- 2x Hamburguesa Clásica ($150.00)\n- 1x Refresco Cola ($25.00)",
            numero_pedido: "VV1701234567",
            total: "$175.00 MXN",
            review_text: "¡Excelente servicio y la comida deliciosa! Muy recomendado.",
            url_anuncio: "https://vecivendo.com/residencial/anuncio/hamburguesas-deliciosas"
        };

        return template
            .replace(/{name}/g, mockData.name)
            .replace(/{phone}/g, mockData.phone)
            .replace(/{direccion}/g, mockData.direccion)
            .replace(/{calle}/g, mockData.calle)
            .replace(/{manzana}/g, mockData.manzana)
            .replace(/{lote}/g, mockData.lote)
            .replace(/{como_llegar}/g, mockData.como_llegar)
            .replace(/{listado}/g, mockData.listado)
            .replace(/{numero_pedido}/g, mockData.numero_pedido)
            .replace(/{numero_pedido}/g, mockData.numero_pedido)
            .replace(/{total}/g, mockData.total)
            .replace(/{review_text}/g, mockData.review_text)
            .replace(/{url_anuncio}/g, mockData.url_anuncio);
    };

    const formatMessage = (text) => {
        if (!text) return null;

        // Split by newlines first to handle line breaks properly
        return text.split('\n').map((line, lineIndex) => {
            // Process formatting for each line
            const parts = line.split(/(\*.*?\*|_.*?_|`.*?`)/g);

            return (
                <span key={lineIndex} className="block min-h-[1.2em]">
                    {parts.map((part, partIndex) => {
                        if (part.startsWith('*') && part.endsWith('*')) {
                            return <strong key={partIndex}>{part.slice(1, -1)}</strong>;
                        }
                        if (part.startsWith('_') && part.endsWith('_')) {
                            return <em key={partIndex}>{part.slice(1, -1)}</em>;
                        }
                        if (part.startsWith('`') && part.endsWith('`')) {
                            return <code key={partIndex} className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">{part.slice(1, -1)}</code>;
                        }
                        return <span key={partIndex}>{part}</span>;
                    })}
                </span>
            );
        });
    };

    const [activeTab, setActiveTab] = useState("general"); // 'general' or 'templates'
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const WhatsAppSimulator = () => (
        <div className="w-full lg:w-[430px] h-[614px] bg-[#E5DDD5] dark:bg-[#111b21] rounded-xl border admin-border overflow-hidden relative flex flex-col shadow-lg mx-auto lg:ml-auto">
            {/* Header Simulation */}
            <div className="bg-[#008069] dark:bg-[#202c33] p-3 flex items-center gap-3 text-white shrink-0 z-20 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center">
                    <img src="/vecivendo_logo_primary.png" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                    <p className="font-medium text-sm leading-tight">VeciVendo</p>
                    <p className="text-xs opacity-80">en línea</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 relative custom-scrollbar">
                {/* Background Pattern Simulation */}
                <div className="absolute inset-0 opacity-10 pointer-events-none fixed-bg" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

                <div className="relative z-10 flex flex-col gap-2">
                    {/* Message Bubble */}
                    <div className="bg-white dark:bg-[#202c33] p-3 rounded-lg shadow-sm max-w-[90%] self-start rounded-tl-none">
                        <div className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
                            {formatMessage(getPreviewMessage(config[TEMPLATES[activeTemplate].id]))}
                        </div>
                        <div className="flex justify-end items-center gap-1 mt-1">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Bar Simulation */}
            <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-2 flex items-center gap-2 shrink-0 z-20">
                <div className="p-2 text-gray-500 dark:text-gray-400">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm8 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fillRule="evenodd"></path></svg>
                </div>
                <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Escribe un mensaje
                </div>
                <div className="p-2 text-gray-500 dark:text-gray-400">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 16.5a7.5 7.5 0 1 1 7.5-7.5 7.5 7.5 0 0 1-7.5 7.5z" fillRule="evenodd"></path></svg>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-full mx-auto pb-24 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold admin-text">Configuración Global</h1>
                <p className="admin-text-muted mt-1">
                    Administra los datos de la plataforma y plantillas de mensajes.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b admin-border mb-6">
                <button
                    onClick={() => setActiveTab("general")}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "general"
                        ? "border-primary-500 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                >
                    Datos de Contacto y Redes
                </button>
                <button
                    onClick={() => setActiveTab("templates")}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "templates"
                        ? "border-primary-500 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                >
                    Plantillas de Mensajes
                </button>
            </div>

            <form id="config-form" onSubmit={handleSubmit} className="admin-surface rounded-xl shadow-sm border admin-border p-6">

                {/* General Tab Content */}
                <div className={activeTab === "general" ? "block space-y-8" : "hidden"}>
                    {/* Contact Info Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold admin-text border-b admin-border pb-2">
                            Datos de Contacto
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium admin-text mb-1">
                                    Email Soporte
                                </label>
                                <input
                                    type="email"
                                    name="email_soporte"
                                    value={config.email_soporte}
                                    onChange={handleChange}
                                    placeholder="soporte@vecivendo.com"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                                />
                                <p className="text-xs text-gray-500 mt-1">Debe ser un correo electrónico válido.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium admin-text mb-1">
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
                                    className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                                />
                                <p className="text-xs text-gray-500 mt-1">Solo números, entre 10 y 15 dígitos (incluyendo código de país).</p>
                            </div>
                        </div>
                    </div>

                    {/* Social Media Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold admin-text border-b admin-border pb-2">
                            Redes Sociales
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium admin-text mb-1">
                                    Facebook
                                </label>
                                <input
                                    type="url"
                                    name="facebook_link"
                                    value={config.facebook_link}
                                    onChange={handleChange}
                                    placeholder="https://facebook.com/..."
                                    pattern="https?://.+"
                                    className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium admin-text mb-1">
                                    Instagram
                                </label>
                                <input
                                    type="url"
                                    name="instagram_link"
                                    value={config.instagram_link}
                                    onChange={handleChange}
                                    placeholder="https://instagram.com/..."
                                    pattern="https?://.+"
                                    className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium admin-text mb-1">
                                    Twitter (X)
                                </label>
                                <input
                                    type="url"
                                    name="twitter_link"
                                    value={config.twitter_link}
                                    onChange={handleChange}
                                    placeholder="https://twitter.com/..."
                                    pattern="https?://.+"
                                    className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium admin-text mb-1">
                                    LinkedIn
                                </label>
                                <input
                                    type="url"
                                    name="linkedin_link"
                                    value={config.linkedin_link}
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/..."
                                    pattern="https?://.+"
                                    className="w-full px-4 py-2 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all invalid:border-red-500 invalid:text-red-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Templates Tab Content */}
                <div className={activeTab === "templates" ? "block space-y-8" : "hidden"}>
                    {/* Template Selector */}
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {Object.entries(TEMPLATES).map(([key, t]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveTemplate(key)}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap border ${activeTemplate === key
                                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Message Template Section */}
                    <div className="space-y-4">
                        <div className="border-b admin-border pb-2">
                            <h2 className="text-lg font-semibold admin-text">
                                {TEMPLATES[activeTemplate].label}
                            </h2>
                            <p className="text-sm admin-text-muted mt-1">
                                {TEMPLATES[activeTemplate].description}
                            </p>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Editor Column */}
                            <div className="space-y-3 flex-1 w-full">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-medium admin-text">
                                        Editor
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsPreviewOpen(true)}
                                        className="lg:hidden text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                        Vista Previa
                                    </button>
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    name={TEMPLATES[activeTemplate].id}
                                    value={config[TEMPLATES[activeTemplate].id]}
                                    onChange={handleChange}
                                    rows={22}
                                    placeholder="Hola veci..."
                                    className="w-full px-4 py-3 rounded-lg border admin-border bg-white dark:bg-gray-700 admin-text focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-mono text-sm resize-none"
                                />

                                <div className="p-4 bg-surface rounded-lg border admin-border">
                                    <p className="text-xs font-medium admin-text mb-3">Variables disponibles (clic para insertar):</p>
                                    <div className="flex flex-wrap gap-2">
                                        {TEMPLATES[activeTemplate].variables.map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => insertVariable(v)}
                                                className="text-xs font-mono bg-surface border admin-border px-2.5 py-1.5 rounded-md text-primary-600 dark:text-primary-400 shadow-sm hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Preview Column (Desktop) */}
                            <div className="hidden lg:block space-y-3 shrink-0 lg:sticky lg:top-6">
                                <label className="block text-sm font-medium admin-text text-right">
                                    Vista Previa (WhatsApp)
                                </label>
                                <WhatsAppSimulator />
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* Mobile Preview Modal */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 lg:hidden backdrop-blur-sm">
                    <div className="bg-transparent w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                        <WhatsAppSimulator />
                    </div>
                </div>
            )}

            {/* Conditional Bottom Bar */}
            <div className={`fixed bottom-0 right-0 left-64 admin-surface border-t admin-border p-4 shadow-lg transform transition-transform duration-300 flex justify-between items-center z-50 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}>
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
