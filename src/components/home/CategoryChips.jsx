
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
    Heart
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as LucideIcons from "lucide-react";

const CATEGORY_ICONS = {
    "Comida": Utensils,
    "Vehículos": Car,
    "Vehiculos": Car,
    "Electrónica": Smartphone,
    "Electronica": Smartphone,
    "Hogar": Home,
    "Ropa": Shirt,
    "Salud": Dumbbell,
    "Belleza": Sparkles,
    "Otros": Sparkles
};

export const CategoryChips = ({ residentialId }) => {
    const { categories } = useCategoryStats(residentialId);
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeCategory = searchParams.get("category");

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

    if (categories.length === 0) return null;

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 px-4 scrollbar-hide">
            {categories.map((category) => {
                const Icon = getIcon(category.icono);
                const isActive = activeCategory === category.slug;

                return (
                    <button
                        key={category.$id}
                        onClick={() => handleCategoryClick(category.slug)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${isActive
                            ? "bg-primary text-white shadow-md transform scale-105"
                            : "bg-surface border border-border text-text-secondary hover:border-primary/50 hover:text-primary"
                            }`}
                    >
                        <Icon size={16} />
                        <span className="text-sm font-medium">{category.nombre}</span>
                        {category.count > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1 ${isActive
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
    );
};
