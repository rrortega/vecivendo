"use client";

import React, { useEffect, useState } from "react";
import { client } from "@/lib/appwrite";
import { Databases } from "appwrite";
import { useFavorites } from "@/hooks/useFavorites";
import { useResidential } from "@/hooks/useResidential";
import { HomeHeader } from "@/components/home/HomeHeader";
import { Footer } from "@/components/layout/Footer";
import { Heart, ArrowLeft, ShoppingCart, ImageOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BottomNav } from "@/components/ui/BottomNav";

export default function FavoritesPage({ params }) {
    const { residencial } = params;
    const { favorites, isFavorite, toggleFavorite } = useFavorites();
    const [favoriteProducts, setFavoriteProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("FavoritesPage: favorites changed:", favorites);
        const fetchFavorites = async () => {
            if (favorites.length === 0) {
                setFavoriteProducts([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                const promises = favorites.map(id =>
                    databases.getDocument(dbId, "anuncios", id)
                        .catch(() => null) // Handle deleted products
                );

                const results = await Promise.all(promises);
                const validProducts = results.filter(p => p !== null);

                setFavoriteProducts(validProducts);
            } catch (error) {
                console.error("Error fetching favorites:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [favorites]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: "MXN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const { residential: residentialData } = useResidential(residencial);
    const residentialName = residentialData?.nombre || residencial;

    return (
        <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
            <HomeHeader residencialName={residentialName} residentialSlug={residencial} />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 mt-16">
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/${residencial}`}>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft size={24} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-text-main flex items-center gap-2">
                            <Heart className="text-primary fill-primary" />
                            Mis Favoritos
                        </h1>
                        <p className="text-text-secondary">
                            {favoriteProducts.length} anuncios guardados
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-surface rounded-xl h-64 animate-pulse border border-border" />
                        ))}
                    </div>
                ) : favoriteProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                        {favoriteProducts.map((product) => (
                            <Link
                                href={`/${residencial}/anuncio/${product.$id}`}
                                key={product.$id}
                                className="group bg-surface rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 dark:bg-white/5">
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

                                <div className="p-3">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-medium text-text-main line-clamp-2 text-sm leading-tight group-hover:text-primary transition-colors">
                                            {product.titulo}
                                        </h3>
                                    </div>

                                    <div className="flex items-end justify-between mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-text-secondary mb-0.5">Precio</span>
                                            <span className="text-lg font-bold text-primary">
                                                {formatPrice(product.precio)}
                                            </span>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary border border-transparent hover:border-primary hover:text-primary -mr-2">
                                            <ShoppingCart size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-surface rounded-3xl border border-border p-8">
                        <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <Heart size={40} className="text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-main mb-2">
                            No tienes favoritos aún
                        </h2>
                        <p className="text-text-secondary max-w-md mb-8">
                            Guarda los anuncios que te interesen para verlos aquí más tarde.
                        </p>
                        <Link href={`/${residencial}`}>
                            <Button className="bg-primary text-white px-8 py-6 rounded-full text-lg shadow-lg shadow-primary/20 transition-all hover:scale-105 border border-transparent hover:border-white">
                                Explorar anuncios
                            </Button>
                        </Link>
                    </div>
                )}
            </main>

            <div className="hidden md:block">
                <Footer />
            </div>
            <BottomNav />
        </div>
    );
}
