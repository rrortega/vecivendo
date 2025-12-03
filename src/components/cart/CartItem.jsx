"use client";

import React from "react";
import { X, Minus, Plus, Gift } from "lucide-react";
import { Button } from "@/components/ui/Button";

import Link from "next/link";

export const CartItem = ({ item, residencial, onUpdateQuantity, onRemove }) => {
    return (
        <div className="flex gap-4 p-4 bg-surface rounded-2xl border border-border mb-4">
            <Link href={`/${residencial}/anuncio/${item.adId || item.id}`} className="shrink-0">
                <div className="h-20 w-20 bg-gray-50 rounded-xl flex items-center justify-center p-2 shrink-0">
                    <img
                        src={item.image || (item.imagenes && item.imagenes[0])}
                        alt={item.name || item.titulo}
                        className="object-cover w-full h-full rounded-lg"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/200?text=No+Image";
                        }}
                    />
                </div>
            </Link>

            <div className="flex-grow flex flex-col justify-between">
                <div className="flex justify-end">
                    <button onClick={() => onRemove(item.$id || item.id)} className="text-text-secondary hover:text-red-500 p-1">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="font-medium text-text-main text-sm line-clamp-2">{item.name || item.titulo}</h3>
                    {item.variant && (
                        <div className="flex flex-col gap-1">
                            <p className="text-xs text-text-secondary font-medium">Variante: {item.variant}</p>
                            {item.offer && (
                                <div className="flex items-center gap-1 text-xs text-primary bg-primary/5 px-2 py-1 rounded-md w-fit">
                                    <Gift size={12} />
                                    <span>{item.offer}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-end mt-1">
                        <span className="font-bold text-text-main">${item.price.toFixed(2)}</span>

                        <div className="flex items-center gap-3 bg-background rounded-lg p-1 border border-border">
                            <button
                                onClick={() => onUpdateQuantity(item.$id || item.id, item.quantity - (item.minQuantity || 1))}
                                className="h-6 w-6 flex items-center justify-center rounded-md border border-transparent hover:border-gray-200 disabled:opacity-50"
                                disabled={item.quantity <= (item.minQuantity || 1)}
                            >
                                <Minus size={14} />
                            </button>
                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <button
                                onClick={() => onUpdateQuantity(item.$id || item.id, item.quantity + (item.minQuantity || 1))}
                                className="h-6 w-6 flex items-center justify-center rounded-md border border-transparent hover:border-green-600 bg-green-50 text-green-600"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
