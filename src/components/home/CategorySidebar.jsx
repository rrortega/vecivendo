"use client";

import React, { useEffect, useState } from "react";
import { client } from "@/lib/appwrite";
import { Databases } from "appwrite";
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
    Sofa
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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

export const CategorySidebar = () => {
    const [categories, setCategories] = useState([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeCategory = searchParams.get("category");
    const searchQuery = searchParams.get("search") || "";

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                const response = await databases.listDocuments(
                    dbId,
                    "anuncios",
                    []
                );

                const uniqueCategories = [...new Set(response.documents.map(doc => doc.categoria?.trim()))].filter(Boolean);
                setCategories(uniqueCategories);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);

    const handleCategoryClick = (category) => {
        const params = new URLSearchParams(searchParams);
        if (activeCategory === category) {
            params.delete("category");
        } else {
            params.set("category", category);
        }
        router.replace(`?${params.toString()}`);
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
                        className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    />
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left border border-transparent ${!activeCategory
                        ? "bg-primary text-white font-semibold shadow-sm"
                        : "text-text-secondary hover:border-primary hover:text-text-main"
                        }`}
                >
                    <Package size={20} />
                    <span className="text-sm">Todas</span>
                </button>

                {/* Category Buttons */}
                {categories.map((category) => {
                    const Icon = CATEGORY_ICONS[category.toLowerCase()] || Sparkles;
                    const isActive = activeCategory === category;

                    return (
                        <button
                            key={category}
                            onClick={() => handleCategoryClick(category)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left border border-transparent ${isActive
                                ? "bg-primary text-white font-semibold shadow-sm"
                                : "text-text-secondary hover:border-primary hover:text-text-main"
                                }`}
                        >
                            <Icon size={20} />
                            <span className="text-sm capitalize">{category}</span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};
