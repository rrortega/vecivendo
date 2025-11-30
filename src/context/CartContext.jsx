"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const { showToast } = useToast();

    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("vecivendo_cart");
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Error parsing cart from localStorage", e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("vecivendo_cart", JSON.stringify(cart));
        }
    }, [cart, isInitialized]);

    const addToCart = (product, quantity = 1) => {
        // Identify advertiser ID
        const advertiserId = product.userId || product.user_id || product.anuncianteId;

        if (!advertiserId) {
            console.warn("Product has no advertiser ID, adding anyway but validation might be skipped.");
        }

        // Check if cart is not empty
        if (cart.length > 0) {
            const existingItem = cart[0];
            const existingAdvertiserId = existingItem.userId || existingItem.user_id || existingItem.anuncianteId;

            // If advertiser IDs exist and are different
            if (advertiserId && existingAdvertiserId && advertiserId !== existingAdvertiserId) {
                return {
                    success: false,
                    error: "advertiser_mismatch",
                    message: "Solo puedes agregar productos del mismo anunciante."
                };
            }
        }

        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(item => item.$id === product.$id);

            if (existingItemIndex >= 0) {
                // Update quantity if item exists
                const newCart = [...prevCart];
                newCart[existingItemIndex] = {
                    ...newCart[existingItemIndex],
                    quantity: newCart[existingItemIndex].quantity + quantity
                };
                return newCart;
            } else {
                // Add new item
                return [...prevCart, { ...product, quantity }];
            }
        });

        return { success: true };
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => (item.$id || item.id) !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + ((item.price || item.precio || 0) * item.quantity), 0);
    };

    const getCartCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            clearCart,
            getCartTotal,
            getCartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
