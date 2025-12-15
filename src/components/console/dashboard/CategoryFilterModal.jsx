'use client';

import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

export default function CategoryFilterModal({ isOpen, onClose, selectedCategories, onApply }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
                const response = await databases.listDocuments(
                    dbId,
                    'categorias',
                    [
                        Query.equal('activo', true),
                        Query.orderAsc('orden'),
                        Query.limit(100)
                    ]
                );

                const mappedCategories = response.documents.map(cat => ({
                    id: cat.$id,
                    label: cat.nombre,
                    iconName: cat.icono || cat.icon // Keep the name
                }));

                setCategories(mappedCategories);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && categories.length === 0) {
            fetchCategories();
        }
    }, [isOpen]);

    // Determine if "All" is selected (empty array)
    const isAllSelected = selectedCategories.length === 0;

    const toggleCategory = (id) => {
        if (selectedCategories.includes(id)) {
            const newSelection = selectedCategories.filter(c => c !== id);
            onApply(newSelection);
        } else {
            onApply([...selectedCategories, id]);
        }
    };

    const handleClear = () => {
        onApply([]);
    };

    const getIcon = (iconName) => {
        if (!iconName) return LucideIcons.Package;
        // Check if it's an emoji (simple check: if it's not a valid Lucide key)
        if (!LucideIcons[iconName]) {
            // If it seems to be an emoji/string that is NOT in Lucide, return null so we can render as text?
            // Or just default to Package.
            // But if it IS an emoji, we want to render it as text.
            // Simple heuristic: if it starts with uppercase and matches /^[A-Z][a-zA-Z]+$/, assume Lucide.
            // Or just check existence.
            // If it's an emoji strings length is usually small chars but logic is tricky.
            // Let's assume if it is NOT in LucideIcons, it might be an emoji.
            return null;
        }
        return LucideIcons[iconName];
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh] border border-gray-100 dark:border-gray-800">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Filtrar por Categoría</h3>
                                    <p className="text-sm text-gray-500 font-medium">
                                        {isAllSelected
                                            ? 'Todas las categorías seleccionadas'
                                            : `${selectedCategories.length} categoría${selectedCategories.length !== 1 ? 's' : ''} seleccionada${selectedCategories.length !== 1 ? 's' : ''}`}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-gray-900">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {categories.map((cat) => {
                                            const isSelected = selectedCategories.includes(cat.id);
                                            const IconComponent = getIcon(cat.iconName);

                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => toggleCategory(cat.id)}
                                                    className={`
                                                        group relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200
                                                        ${isSelected
                                                            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm ring-1 ring-primary/20'
                                                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                                                    `}
                                                >
                                                    <span className="text-2xl filter drop-shadow-sm flex items-center justify-center w-8 h-8">
                                                        {IconComponent ? <IconComponent size={24} /> : (cat.iconName || '📦')}
                                                    </span>
                                                    <span className={`font-medium text-sm sm:text-base ${isSelected ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {cat.label}
                                                    </span>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2">
                                                            <Check className="w-4 h-4 text-primary" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                                {!isAllSelected && (
                                    <button
                                        onClick={handleClear}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/25 active:scale-95"
                                >
                                    Aplicar Filtros
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
