'use client';

import { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

export default function ResidentialFilter({ onResidentialChange, selectedId }) {
    const [residentials, setResidentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchResidentials();
    }, []);

    const fetchResidentials = async () => {
        try {
            const response = await databases.listDocuments(DB_ID, 'residenciales', [
                Query.limit(100),
                Query.orderAsc('nombre')
            ]);
            setResidentials(response.documents);
        } catch (error) {
            console.error('Error fetching residentials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (id) => {
        onResidentialChange(id);
        setIsOpen(false);
    };

    const selectedResidential = residentials.find(r => r.$id === selectedId);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Filtrar por residencial
            </h3>

            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
                    disabled={loading}
                >
                    <span>
                        {loading
                            ? 'Cargando...'
                            : selectedResidential
                                ? selectedResidential.nombre
                                : 'Todos los residenciales'
                        }
                    </span>
                    <svg
                        className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <button
                            onClick={() => handleSelect(null)}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${!selectedId
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}
                        >
                            Todos los residenciales
                        </button>

                        {residentials.map((residential) => (
                            <button
                                key={residential.$id}
                                onClick={() => handleSelect(residential.$id)}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedId === residential.$id
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                                        : 'text-gray-900 dark:text-gray-100'
                                    }`}
                            >
                                {residential.nombre}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Cerrar dropdown al hacer clic fuera */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
