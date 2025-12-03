"use client";

import React, { useEffect, useState } from "react";
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";
import { Heart, ShoppingCart, ImageOff, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useFavorites } from "@/hooks/useFavorites";

export const ProductGrid = ({ currency = "MXN", residentialSlug, residentialId: propResidentialId, sortOption = "recent" }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [residentialId, setResidentialId] = useState(propResidentialId);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("search")?.toLowerCase() || "";
    const categoryFilter = searchParams.get("category");
    const viewMode = searchParams.get("view") || "grid";

    const { isFavorite, toggleFavorite } = useFavorites();

    useEffect(() => {
        if (propResidentialId) {
            setResidentialId(propResidentialId);
            return;
        }

        const fetchResidentialId = async () => {
            if (!residentialSlug) return;
            try {
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
                const response = await databases.listDocuments(
                    dbId,
                    "residenciales",
                    [Query.equal("slug", residentialSlug)]
                );
                if (response.documents.length > 0) {
                    setResidentialId(response.documents[0].$id);
                }
            } catch (error) {
                console.error("Error fetching residential ID:", error);
            }
        };
        fetchResidentialId();
    }, [residentialSlug, propResidentialId]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, categoryFilter, sortOption, itemsPerPage]);

    // Then fetch products filtered by residential
    useEffect(() => {
        if (!residentialId) return;

        const fetchProducts = async () => {
            if (products.length === 0) {
                setLoading(true);
            } else {
                setIsFetching(true);
            }

            try {
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                let sortQuery = Query.orderDesc("$updatedAt");
                if (sortOption === "price_asc") {
                    sortQuery = Query.orderAsc("precio");
                } else if (sortOption === "price_desc") {
                    sortQuery = Query.orderDesc("precio");
                }

                const queries = [
                    Query.equal("residencial", residentialId),
                    sortQuery,
                    Query.limit(itemsPerPage),
                    Query.offset((currentPage - 1) * itemsPerPage)
                ];

                if (categoryFilter) {
                    queries.push(Query.equal("categoria", categoryFilter));
                }

                if (searchQuery) {
                    // Attempt to use server-side search. 
                    // Requires a Fulltext index on 'titulo' (and 'descripcion' if desired).
                    // If index is missing, this might fail, so we catch errors.
                    queries.push(Query.search("titulo", searchQuery));
                }

                const response = await databases.listDocuments(
                    dbId,
                    "anuncios",
                    queries
                );
                setProducts(response.documents);
                setTotalItems(response.total);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
                setIsFetching(false);
            }
        };

        fetchProducts();
    }, [residentialId, sortOption, currentPage, itemsPerPage, categoryFilter, searchQuery]); // Added searchQuery

    // Optimistic filtering: Filter and sort the CURRENTLY loaded products immediately.
    // This gives instant feedback while the server query runs in the background.
    const filteredProducts = products
        .filter(product => {
            const matchesSearch = !searchQuery ||
                product.titulo?.toLowerCase().includes(searchQuery) ||
                product.descripcion?.toLowerCase().includes(searchQuery);

            const matchesCategory = !categoryFilter || product.categoria === categoryFilter;

            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortOption === "price_asc") {
                return a.precio - b.precio;
            } else if (sortOption === "price_desc") {
                return b.precio - a.precio;
            } else {
                // Default: recent (updatedAt desc)
                return new Date(b.$updatedAt) - new Date(a.$updatedAt);
            }
        });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Scroll to top of grid
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-20">
                {[...Array(itemsPerPage)].map((_, i) => (
                    <div key={i} className="bg-surface rounded-xl h-64 animate-pulse border border-border" />
                ))}
            </div>
        );
    }

    if (filteredProducts.length === 0 && !loading && totalItems === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 text-text-secondary">
                    <Search size={32} />
                </div>
                <h3 className="text-lg font-bold text-text-main mb-2">No se encontraron productos</h3>
                <p className="text-text-secondary max-w-xs mx-auto">
                    Intenta ajustar tu búsqueda o filtros para encontrar lo que necesitas.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-20 relative">
            {isFetching && (
                <div className="absolute top-0 right-4 z-10">
                    <div className="bg-surface/80 backdrop-blur-sm p-2 rounded-full shadow-sm border border-border">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                </div>
            )}
            <div className={viewMode === "grid"
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4"
                : "flex flex-col gap-4 px-4 max-w-full mx-auto"
            }>
                {filteredProducts.map((product) => (
                    <Link
                        href={`/${residentialSlug}/anuncio/${product.$id}`}
                        key={product.$id}
                        className={`group bg-surface rounded-xl overflow-hidden border border-gray-200 dark:border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${viewMode === "list" ? "flex flex-row h-40 md:h-48" : ""
                            }`}
                    >
                        {/* Image Container */}
                        <div className={`${viewMode === "list" ? "w-40 md:w-56 shrink-0" : "aspect-[4/3]"} relative overflow-hidden bg-gray-100 dark:bg-white/5`}>
                            {(() => {
                                const images = product.imagenes || [];
                                const firstImage = Array.isArray(images) ? images[0] : null;
                                return firstImage ? (
                                    <img
                                        src={firstImage}
                                        alt={product.titulo}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-secondary">
                                        <ImageOff size={24} className="opacity-50" />
                                    </div>
                                );
                            })()}

                            {/* Favorite Button */}
                            <button
                                onClick={(e) => toggleFavorite(e, product.$id)}
                                className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all shadow-sm duration-200 ${isFavorite(product.$id)
                                    ? "bg-white text-red-500 opacity-100 scale-110"
                                    : "bg-white/80 text-gray-600 hover:text-red-500 border border-transparent hover:border-red-500 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                    }`}
                            >
                                <Heart size={18} fill={isFavorite(product.$id) ? "currentColor" : "none"} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className={`p-3 ${viewMode === "list" ? "flex flex-col flex-1 justify-between p-4" : ""}`}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className={`font-medium text-text-main leading-tight group-hover:text-primary transition-colors ${viewMode === "list" ? "text-lg line-clamp-2" : "text-sm line-clamp-2"}`}>
                                    {product.titulo}
                                </h3>
                            </div>

                            {viewMode === "list" && (
                                <p className="text-sm text-text-secondary line-clamp-2 mb-2 hidden md:block">
                                    {product.descripcion}
                                </p>
                            )}

                            <div className="flex items-end justify-between mt-2">
                                <div className="flex flex-col">
                                    <span className="text-xs text-text-secondary mb-0.5">Precio</span>
                                    <span className="text-lg font-bold text-primary">
                                        {formatPrice(product.precio)}
                                    </span>
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary hover:text-primary -mr-2">
                                    <ShoppingCart size={18} />
                                </Button>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <span>Mostrar:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="bg-surface border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>por página</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 px-3"
                        >
                            Anterior
                        </Button>
                        <span className="text-sm text-text-secondary">
                            Página {currentPage} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8 px-3"
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
