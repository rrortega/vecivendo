"use client";

import React from "react";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

import Link from "next/link";

export const CartItem = ({ item, residencial, onUpdateQuantity, onRemove }) => {
    return (
        <div className="flex gap-4 p-4 bg-surface rounded-2xl border border-border mb-4">
            <Link href={`/${residencial}/anuncio/${item.id}`} className="shrink-0">
                <div className="h-20 w-20 bg-gray-50 rounded-xl flex items-center justify-center p-2 shrink-0">
                    <img
                        src={item.image}
                        alt={item.name}
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
                    <button onClick={() => onRemove(item.id)} className="text-text-secondary hover:text-red-500 p-1">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="font-medium text-text-main text-sm line-clamp-2">{item.name}</h3>
                    {item.variant && <p className="text-xs text-text-secondary">{item.variant}</p>}

                    <div className="flex justify-between items-end mt-1">
                        <span className="font-bold text-text-main">${item.price.toFixed(2)}</span>

                        <div className="flex items-center gap-3 bg-background rounded-lg p-1 border border-border">
                            <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                className="h-6 w-6 flex items-center justify-center rounded-md border border-transparent hover:border-gray-200 disabled:opacity-50"
                                disabled={item.quantity <= 1}
                            >
                                <Minus size={14} />
                            </button>
                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
