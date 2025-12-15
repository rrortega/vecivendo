"use client";

import React, { useEffect, useState } from "react";
import { client } from "@/lib/appwrite";
import { Databases } from "appwrite";
import { useCategoryStats } from "@/hooks/useCategoryStats";
import {
    Utensils,
    Car,
    Smartphone,
    Home,
    Shirt,
    Dumbbell,
    Sparkles,
    Search,
    Package,
    Wrench,
    Sofa,
    LayoutGrid,
    X
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as LucideIcons from "lucide-react";

const CATEGORY_ICONS = {
    "comida": Utensils,
    "vehiculos": Car,
    "tecnologia": Smartphone,
    "electrodomesticos": Home,
    "ropa": Shirt,
    "deportes": Dumbbell,
    "servicios": Wrench,
    "muebles": Sofa,
    "otros": Sparkles
};

export const CategorySidebar = ({ residentialId }) => {
    const { categories, totalCount } = useCategoryStats(residentialId);
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeCategory = searchParams.get("category");
    const searchQuery = searchParams.get("search") || "";

    const handleCategoryClick = (categorySlug) => {
        const params = new URLSearchParams(searchParams);
        if (activeCategory === categorySlug) {
            params.delete("category");
        } else {
            params.set("category", categorySlug);
        }
        router.replace(`?${params.toString()}`);
    };

    const getIcon = (iconName) => {
        const Icon = LucideIcons[iconName];
        return Icon || LucideIcons.Package;
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set("search", value);
        } else {
            params.delete("search");
        }
        router.replace(`?${params.toString()}`);
    };

    const clearSearch = () => {
        const params = new URLSearchParams(searchParams);
        params.delete("search");
        router.replace(`?${params.toString()}`);
    };

    return (
        <aside className="hidden md:block w-64 shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-6">
            {/* Search Input - For searching products */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full bg-surface border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-main p-1 rounded-full hover:bg-surface-hover transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Categories Title */}
            <h2 className="font-bold text-text-main mb-3 text-sm uppercase tracking-wider">
                Categorías
            </h2>

            {/* Categories List - Scrollable with custom scrollbar */}
            <div className="max-h-[calc(100vh-20rem)] overflow-y-auto pr-2 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-text-secondary/30">
                {/* All Categories Option */}
                <button
                    onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.delete("category");
                        router.replace(`?${params.toString()}`);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left border border-transparent ${!activeCategory
                        ? "bg-primary text-white font-semibold shadow-sm"
                        : "text-text-secondary hover:border-primary hover:text-text-main"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <LayoutGrid size={20} />
                        <span className="text-sm">Todas</span>
                    </div>
                    {totalCount > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${!activeCategory
                            ? "bg-white/20 text-white"
                            : "bg-surface-hover text-text-secondary"
                            }`}>
                            {totalCount}
                        </span>
                    )}
                </button>

                {/* Category Buttons */}
                {categories.map((category) => {
                    const Icon = getIcon(category.icono);
                    const isActive = activeCategory === category.slug;

                    return (
                        <button
                            key={category.$id}
                            onClick={() => handleCategoryClick(category.slug)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left border border-transparent ${isActive
                                ? "bg-primary text-white font-semibold shadow-sm"
                                : "text-text-secondary hover:border-primary hover:text-text-main"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={20} />
                                <span className="text-sm">{category.nombre}</span>
                            </div>
                            {category.count > 0 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-surface-hover text-text-secondary"
                                    }`}>
                                    {category.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};
