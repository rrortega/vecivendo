"use client";

import React, { useState } from "react";
import { ProductHeader } from "@/components/product/ProductHeader";
import { VariantSelector } from "@/components/product/VariantSelector";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Star, ThumbsUp } from "lucide-react";
import Image from "next/image";

// Mock data
const productData = {
    id: "3",
    name: "Xbox Series X",
    rating: 4.8,
    reviews: 117,
    approval: "94%",
    description: "The Microsoft Xbox Series X gaming console is capable of impressing with minimal boot times and mesmerizing visual effects when playing games at up to 120 frames per second.",
    variants: ["1TB", "825GB", "512GB"],
    prices: { "1TB": 570.00, "825GB": 499.00, "512GB": 399.00 },
    originalPrices: { "1TB": 650.00, "825GB": 550.00, "512GB": 450.00 },
    image: "https://images.unsplash.com/photo-1621259182902-48097d91461f?auto=format&fit=crop&w=800&q=80",
    residential_id: "demo-residential",
    user_phone: "5215555555555", // Demo advertiser phone
    residential_slug: "demo"
};

import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

export default function ProductPage({ params }) {
    const [selectedVariant, setSelectedVariant] = useState("1TB");
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const currentPrice = productData.prices[selectedVariant];
    const originalPrice = productData.originalPrices[selectedVariant];

    const handleAddToCart = () => {
        const productToAdd = {
            ...productData,
            price: currentPrice,
            variant: selectedVariant,
            // Ensure ID is unique per variant if needed, or just use product ID
            id: productData.id,
            // Add quantity 1
        };

        const result = addToCart(productToAdd, 1);
        if (result.success) {
            showToast("Producto agregado al carrito", "success");
        } else {
            showToast(result.message || "Error al agregar al carrito", "error");
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <ProductHeader />

            <main className="px-4 pt-4">
                {/* Image */}
                <div className="relative w-full aspect-square bg-surface rounded-3xl mb-6 flex items-center justify-center p-8 shadow-sm border border-border">
                    <img
                        src={productData.image}
                        alt={productData.name}
                        className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal"
                    />
                </div>

                {/* Info */}
                <div className="mb-2">
                    <h1 className="text-2xl font-bold text-text-main mb-2">{productData.name}</h1>
                    <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                        <div className="flex items-center gap-1">
                            <Star size={16} className="fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-text-main">{productData.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ThumbsUp size={16} className="text-green-500" />
                            <span className="font-semibold text-text-main">{productData.approval}</span>
                            <span>aprobación</span>
                        </div>
                        <span>({productData.reviews} reseñas)</span>
                    </div>

                    <Badge variant="sale" className="mb-6">En oferta</Badge>

                    <p className="text-text-secondary leading-relaxed mb-6">
                        {productData.description}
                    </p>
                </div>

                {/* Variants */}
                <VariantSelector
                    variants={productData.variants}
                    selected={selectedVariant}
                    onSelect={setSelectedVariant}
                />

                {/* Price & Action */}
                <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <span className="text-xs text-text-secondary line-through block">${originalPrice.toFixed(2)}</span>
                            <span className="text-2xl font-bold text-text-main">${currentPrice.toFixed(2)}</span>
                        </div>
                        <Button size="lg" className="w-2/3 rounded-2xl" onClick={handleAddToCart}>
                            Agregar al Carrito
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
