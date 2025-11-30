import React from "react";
import Link from "next/link";
import { MapPin, Clock, Tag } from "lucide-react";
import { BaseCard } from "@/components/ui/BaseCard";

export default function Card({ ad, href, layout = "grid" }) {
    const { titulo, precio, imagenes, categoria, fecha_publicacion, ubicacion } = ad;

    // Helper to format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(price);
    };

    // Helper for date
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
    };

    const imageUrl = imagenes && imagenes.length > 0 ? imagenes[0] : null;

    if (layout === "list") {
        return (
            <Link href={href} className="block mb-4">
                <BaseCard className="flex flex-row h-32 hover:shadow-md transition-shadow">
                    <div className="w-32 h-32 relative bg-gray-100 shrink-0">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={titulo}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Tag size={24} />
                            </div>
                        )}
                    </div>
                    <div className="p-4 flex flex-col justify-between flex-grow min-w-0">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-text-main truncate pr-2">{titulo}</h3>
                                <span className="font-bold text-primary whitespace-nowrap">{formatPrice(precio)}</span>
                            </div>
                            <p className="text-sm text-text-secondary mt-1">{categoria}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-secondary mt-2">
                            {ubicacion && (
                                <div className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    <span className="truncate max-w-[100px]">{ubicacion}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{formatDate(fecha_publicacion)}</span>
                            </div>
                        </div>
                    </div>
                </BaseCard>
            </Link>
        );
    }

    // Grid Layout
    return (
        <Link href={href} className="block h-full">
            <BaseCard className="h-full flex flex-col hover:shadow-md transition-shadow group">
                <div className="aspect-[4/3] relative bg-gray-100 overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={titulo}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Tag size={32} />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-semibold text-text-main shadow-sm">
                        {categoria}
                    </div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-semibold text-text-main mb-1 line-clamp-2">{titulo}</h3>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="font-bold text-lg text-primary">{formatPrice(precio)}</span>
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(fecha_publicacion)}
                        </span>
                    </div>
                </div>
            </BaseCard>
        </Link>
    );
}
