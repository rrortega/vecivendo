"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";

export const useFavorites = () => {
    const [favorites, setFavorites] = useState([]);
    const { showToast } = useToast();

    // Load favorites from localStorage on mount
    useEffect(() => {
        const storedFavorites = localStorage.getItem("vecivendo_favorites");
        console.log("useFavorites: Loaded from localStorage:", storedFavorites);
        if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
        }
    }, []);

    const isFavorite = (productId) => {
        return favorites.includes(productId);
    };

    const toggleFavorite = (e, productId) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();

        let newFavorites;
        if (favorites.includes(productId)) {
            newFavorites = favorites.filter(id => id !== productId);
            showToast("Eliminado de favoritos", "info");
        } else {
            newFavorites = [...favorites, productId];
            showToast("Agregado a favoritos", "success");
        }

        console.log("useFavorites: Saving to localStorage:", newFavorites);
        setFavorites(newFavorites);
        localStorage.setItem("vecivendo_favorites", JSON.stringify(newFavorites));
    };

    return {
        favorites,
        isFavorite,
        toggleFavorite
    };
};
