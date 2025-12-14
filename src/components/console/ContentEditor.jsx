"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Edit3 } from "lucide-react";

export default function ContentEditor({ value, onChange, label = "Contenido" }) {
    const [mode, setMode] = useState("edit"); // 'edit' or 'preview'

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium admin-text">
                    {label}
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setMode("edit")}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 border ${mode === "edit"
                            ? "bg-primary-500 border-primary-500 text-white shadow-sm"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                    >
                        <Edit3 size={16} />
                        <span>Editar</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("preview")}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 border ${mode === "preview"
                            ? "bg-primary-500 border-primary-500 text-white shadow-sm"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                    >
                        <Eye size={16} />
                        <span>Vista Previa</span>
                    </button>
                </div>
            </div>

            <div className="w-full">
                {mode === "edit" ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-[600px] px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl font-mono text-sm resize-y shadow-sm border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="# Escribe tu contenido aquí en Markdown..."
                    />
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 h-[600px] overflow-y-auto border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-gray-900 dark:text-gray-100">
                            {value ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {value}
                                </ReactMarkdown>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Eye size={48} className="mb-4 opacity-20" />
                                    <p className="italic">No hay contenido para previsualizar</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs admin-text-muted flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor" /></svg>
                Soporta Markdown: **negrita**, *cursiva*, [enlaces](url), listas, tablas, etc.
            </p>
        </div>
    );
}
