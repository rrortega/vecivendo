"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useToast } from "@/context/ToastContext";
import { Plus, Search, Edit, Trash2, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import ConfirmModal from "@/components/console/ConfirmModal";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'inactive'
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, category: null });
    const { showToast } = useToast();
    const router = useRouter();

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "categorias";

    useEffect(() => {
        fetchCategories();
    }, [filterStatus]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const queries = [Query.orderAsc("orden")];

            if (filterStatus === "active") {
                queries.push(Query.equal("activo", true));
            } else if (filterStatus === "inactive") {
                queries.push(Query.equal("activo", false));
            }

            const response = await databases.listDocuments(dbId, collectionId, queries);
            setCategories(response.documents);
        } catch (error) {
            console.error("Error fetching categories:", error);
            showToast("Error al cargar categorías", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.category) return;

        try {
            await databases.deleteDocument(dbId, collectionId, deleteModal.category.$id);
            showToast("Categoría eliminada correctamente", "success");
            setDeleteModal({ isOpen: false, category: null });
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
            showToast("Error al eliminar categoría", "error");
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIcon = (iconName) => {
        const Icon = LucideIcons[iconName];
        return Icon ? <Icon size={20} className="text-primary-600" /> : <Tag size={20} className="text-gray-400" />;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold admin-text">Categorías</h1>
                    <p className="admin-text-muted">Administra las categorías de anuncios</p>
                </div>
                <Link
                    href="/console/categories/create"
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Nueva Categoría
                </Link>
            </div>

            {/* Filters */}
            <div className="admin-surface rounded-xl border admin-border p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o slug..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="all">Todas</option>
                        <option value="active">Activas</option>
                        <option value="inactive">Inactivas</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="admin-surface rounded-xl border admin-border overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center admin-text-muted">
                        Cargando categorías...
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="p-12 text-center">
                        <Tag className="mx-auto text-gray-400 mb-4" size={48} />
                        <h3 className="text-lg font-medium admin-text mb-2">
                            {searchTerm ? "No se encontraron categorías" : "Sin categorías"}
                        </h3>
                        <p className="admin-text-muted mb-4">
                            {searchTerm ? "Intenta con otro término de búsqueda" : "Comienza creando tu primera categoría"}
                        </p>
                        {!searchTerm && (
                            <Link
                                href="/console/categories/create"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                            >
                                <Plus size={20} />
                                Nueva Categoría
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="admin-bg border-b admin-border">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium admin-text-muted uppercase tracking-wider">
                                        Icono
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium admin-text-muted uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium admin-text-muted uppercase tracking-wider">
                                        Slug
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium admin-text-muted uppercase tracking-wider">
                                        Orden
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium admin-text-muted uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium admin-text-muted uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y admin-border">
                                {filteredCategories.map((category) => (
                                    <tr key={category.$id} className="admin-hover transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getIcon(category.icono)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium admin-text">{category.nombre}</div>
                                            {category.descripcion && (
                                                <div className="text-sm admin-text-muted">{category.descripcion}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <code className="text-sm admin-text-muted">{category.slug}</code>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap admin-text">
                                            {category.orden || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${category.activo
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                                }`}>
                                                {category.activo ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/console/categories/${category.$id}`}
                                                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, category })}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, category: null })}
                onConfirm={handleDelete}
                title="Eliminar Categoría"
                message={`¿Estás seguro de que deseas eliminar la categoría "${deleteModal.category?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
}
