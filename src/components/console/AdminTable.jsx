"use client";

import { useState } from "react";

export default function AdminTable({ columns, data, onEdit, onDelete, onRowClick, isLoading }) {
    // Skeleton Loading
    if (isLoading) {
        return (
            <div className="admin-surface rounded-xl border admin-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="admin-bg/50 admin-text-muted font-medium border-b admin-border">
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key} className="px-4 py-3">
                                        {col.label}
                                    </th>
                                ))}
                                {(onEdit || onDelete) && <th className="px-4 py-3"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y admin-border">
                            {[...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {columns.map((col, index) => (
                                        <td key={index} className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                        </td>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <td className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto"></div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Empty State
    if (!data || data.length === 0) {
        return (
            <div className="w-full p-12 text-center admin-surface rounded-xl border admin-border flex flex-col items-center justify-center">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3 className="text-sm font-medium admin-text">No hay datos</h3>
                <p className="text-sm admin-text-muted mt-1">No se encontraron registros para mostrar.</p>
            </div>
        );
    }

    const showActionsColumn = onEdit || onDelete || onRowClick;

    return (
        <div className="admin-surface rounded-xl border admin-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="admin-bg/50 admin-text-muted font-medium border-b admin-border">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className="px-4 py-3"
                                >
                                    {col.label}
                                </th>
                            ))}
                            {showActionsColumn && (
                                <th scope="col" className="relative px-4 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y admin-border">
                        {data.map((row, rowIndex) => (
                            <tr
                                key={row.$id || rowIndex}
                                onClick={() => onRowClick && onRowClick(row)}
                                className={`transition-colors group ${onRowClick ? 'cursor-pointer admin-hover' : 'admin-hover'}`}
                            >
                                {columns.map((col) => (
                                    <td key={`${row.$id}-${col.key}`} className="px-4 py-3 admin-text">
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                                {showActionsColumn && (
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2 items-center">
                                            {onEdit && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                                                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                                >
                                                    Editar
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                            {onRowClick && (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    <path d="m9 18 6-6-6-6" />
                                                </svg>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

