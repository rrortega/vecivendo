"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = "contenidos";

export default function ContentsPage() {
    const router = useRouter();
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchContents();
    }, []);

    async function fetchContents() {
        try {
            setLoading(true);
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ID,
                [Query.limit(100), Query.orderDesc("$updatedAt")]
            );

            setContents(response.documents);

            // Extract unique categories
            const uniqueCategories = [
                ...new Set(
                    response.documents
                        .map((doc) => doc.category)
                        .filter(Boolean)
                ),
            ];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error("Error fetching contents:", error);
        } finally {
            setLoading(false);
        }
    }

    // Client-side filtering
    const filteredContents = contents.filter((content) => {
        const matchesSearch =
            content.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            content.descripcion?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType =
            typeFilter === "all" || content.tipo_contenido === typeFilter;
        const matchesCategory =
            categoryFilter === "all" || content.category === categoryFilter;
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && content.active) ||
            (statusFilter === "inactive" && !content.active);

        return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentContents = filteredContents.slice(
        indexOfFirstItem,
        indexOfLastItem
    );
    const totalPages = Math.ceil(filteredContents.length / itemsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter, categoryFilter, statusFilter]);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold admin-text">Contenidos</h1>
                    <p className="admin-text-muted mt-1">
                        Gestiona artículos, FAQs y contenido del centro de ayuda
                    </p>
                </div>
                <Link
                    href="/console/contents/create"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    <Plus size={20} />
                    Crear Nuevo
                </Link>
            </div>

            {/* Filters */}
            <div className="admin-surface rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 admin-text-muted">
                    <Filter size={18} />
                    <span className="font-medium">Filtros</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 admin-text-muted"
                        />
                        <input
                            type="text"
                            placeholder="Buscar por título..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 admin-input rounded-lg"
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="admin-input rounded-lg px-4 py-2"
                    >
                        <option value="all">Todos los tipos</option>
                        <option value="faqs">FAQs</option>
                        <option value="blog">Blog</option>
                        <option value="help">Ayuda</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="admin-input rounded-lg px-4 py-2"
                    >
                        <option value="all">Todas las categorías</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="admin-input rounded-lg px-4 py-2"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            ) : (
                <>
                    <div className="admin-surface rounded-lg overflow-hidden border admin-border">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b admin-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium admin-text-muted uppercase tracking-wider">
                                            Título
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium admin-text-muted uppercase tracking-wider">
                                            Tipo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium admin-text-muted uppercase tracking-wider">
                                            Categoría
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium admin-text-muted uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium admin-text-muted uppercase tracking-wider">
                                            Actualizado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y admin-border">
                                    {currentContents.length > 0 ? (
                                        currentContents.map((content) => (
                                            <tr
                                                key={content.$id}
                                                onClick={() =>
                                                    router.push(
                                                        `/console/contents/${content.$id}`
                                                    )
                                                }
                                                className="admin-hover cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium admin-text">
                                                        {content.titulo}
                                                    </div>
                                                    <div className="text-xs admin-text-muted mt-1 line-clamp-1">
                                                        {content.descripcion}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {content.tipo_contenido}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm admin-text">
                                                    {content.category || "-"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-2 py-1 text-xs rounded-full ${content.active
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                                            }`}
                                                    >
                                                        {content.active
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm admin-text-muted">
                                                    {new Date(
                                                        content.$updatedAt
                                                    ).toLocaleDateString("es-MX", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-12 text-center admin-text-muted"
                                            >
                                                No se encontraron contenidos
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center">
                            <p className="text-sm admin-text-muted">
                                Mostrando {indexOfFirstItem + 1} a{" "}
                                {Math.min(indexOfLastItem, filteredContents.length)}{" "}
                                de {filteredContents.length} contenidos
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                                    }
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg admin-surface admin-border admin-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm admin-text">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(prev + 1, totalPages)
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg admin-surface admin-border admin-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Mobile FAB */}
            <Link
                href="/console/contents/create"
                className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors z-10"
            >
                <Plus size={24} />
            </Link>
        </div>
    );
}
