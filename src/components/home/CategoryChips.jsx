
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
    Heart
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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

export const CategoryChips = () => {
    const [categories, setCategories] = useState([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeCategory = searchParams.get("category");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                // Fetch unique categories from products or a categories collection
                // For now, let's assume we fetch from 'productos' and aggregate, 
                // or better, fetch from a 'categorias' collection if it existed.
                // Since we don't have a dedicated categories collection in the prompt context,
                // we'll fetch products and extract unique categories.
                // OPTIMIZATION: In a real app, use a dedicated collection or Appwrite aggregation.

                const response = await databases.listDocuments(
                    dbId,
                    "productos",
                    [] // Fetch all (limit 25 by default)
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

    if (categories.length === 0) return null;

    return (
        <div className="flex gap-3 overflow-x-auto pb-4 px-4 scrollbar-hide">
            {categories.map((category) => {
                const Icon = CATEGORY_ICONS[category] || Sparkles;
                const isActive = activeCategory === category;

                return (
                    <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${isActive
                                ? "bg-primary text-white shadow-md transform scale-105"
                                : "bg-surface border border-border text-text-secondary hover:border-primary/50 hover:text-primary"
                            }`}
                    >    <Icon size={16} />
                        <span className="text-sm font-medium">{category}</span>
                    </button>
                );
            })}
        </div>
    );
};
