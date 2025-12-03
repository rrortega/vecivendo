"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Edit3 } from "lucide-react";

export default function ContentEditor({ value, onChange, label = "Contenido" }) {
    const [mode, setMode] = useState("edit"); // 'edit' or 'preview'

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium admin-text">
                    {label}
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setMode("edit")}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${mode === "edit"
                                ? "bg-primary-500 text-white"
                                : "admin-surface admin-text-muted admin-hover"
                            }`}
                    >
                        <Edit3 size={14} />
                        <span className="hidden sm:inline">Editar</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("preview")}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${mode === "preview"
                                ? "bg-primary-500 text-white"
                                : "admin-surface admin-text-muted admin-hover"
                            }`}
                    >
                        <Eye size={14} />
                        <span className="hidden sm:inline">Vista Previa</span>
                    </button>
                </div>
            </div>

            {/* Desktop: Split View */}
            <div className="hidden md:grid md:grid-cols-2 gap-4">
                <div>
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-96 px-4 py-3 admin-input rounded-lg font-mono text-sm resize-y"
                        placeholder="Escribe tu contenido en Markdown..."
                    />
                </div>
                <div className="admin-surface rounded-lg p-4 h-96 overflow-y-auto border admin-border">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {value ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {value}
                            </ReactMarkdown>
                        ) : (
                            <p className="admin-text-muted italic">
                                La vista previa aparecerá aquí...
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile: Toggle View */}
            <div className="md:hidden">
                {mode === "edit" ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-96 px-4 py-3 admin-input rounded-lg font-mono text-sm resize-y"
                        placeholder="Escribe tu contenido en Markdown..."
                    />
                ) : (
                    <div className="admin-surface rounded-lg p-4 h-96 overflow-y-auto border admin-border">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            {value ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {value}
                                </ReactMarkdown>
                            ) : (
                                <p className="admin-text-muted italic">
                                    La vista previa aparecerá aquí...
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs admin-text-muted">
                Soporta Markdown con sintaxis GitHub Flavored Markdown (tablas, listas de tareas, etc.)
            </p>
        </div>
    );
}
