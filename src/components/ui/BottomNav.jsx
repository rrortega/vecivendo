"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Home, Heart, ShoppingBag, User } from "lucide-react";

export const BottomNav = ({ className = "" }) => {
    const pathname = usePathname();
    const params = useParams();
    const residentialSlug = params?.residencial;

    const navItems = [
        { icon: Home, label: "Inicio", href: residentialSlug ? `/${residentialSlug}` : "/" },
        { icon: Heart, label: "Favoritos", href: residentialSlug ? `/${residentialSlug}/favoritos` : "/favoritos" },
        { icon: ShoppingBag, label: "Mi historial", href: residentialSlug ? `/${residentialSlug}/historial` : "/historial" },
        { icon: User, label: "Perfil", href: residentialSlug ? `/${residentialSlug}/perfil` : "/perfil" },
    ];

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-[100] bg-surface/80 backdrop-blur-lg border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-safe md:hidden ${className}`}>
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? "text-primary" : "text-text-secondary hover:text-text-main"
                                }`}
                        >
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
