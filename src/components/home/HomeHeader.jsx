
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingCart, Sun, Moon, Grid, List, User, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";

export const HomeHeader = ({ residencialName, residentialSlug, sortOption, onSortChange, showSearch = true, showFilters = true }) => {
    const { theme, toggleTheme } = useTheme();
    const { getCartCount } = useCart();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
    const [mounted, setMounted] = useState(false);

    // Load view mode from localStorage
    useEffect(() => {
        setMounted(true);
        const savedViewMode = localStorage.getItem("viewMode");
        if (savedViewMode) {
            setViewMode(savedViewMode);
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Sync search with URL params
    useEffect(() => {
        const query = searchParams.get("search");
        if (query) {
            setSearchQuery(query);
            setIsSearchActive(true);
        }
    }, [searchParams]);

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        localStorage.setItem("viewMode", mode);
        // Update URL param for view mode
        const params = new URLSearchParams(searchParams);
        params.set("view", mode);
        router.replace(`?${params.toString()}`);
        // TODO: Implement actual view change in ProductGrid
    };



    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);

        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set("search", value);
        } else {
            params.delete("search");
        }
        router.replace(`?${params.toString()}`);
    };

    const clearSearch = () => {
        setSearchQuery("");
        setIsSearchActive(false);
        const params = new URLSearchParams(searchParams);
        params.delete("search");
        router.replace(`?${params.toString()}`);
    };

    return (
        <header
            style={{ top: 'var(--alert-bar-height, 0px)' }}
            className={`relative md:fixed left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled || isSearchActive
                ? "bg-surface/80 backdrop-blur-lg border-border"
                : "bg-transparent border-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Mobile Search View - Only visible on mobile */}
                {showSearch && isSearchActive && (
                    <div className="md:hidden w-full flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Buscar en el residencial..."
                                className="w-full bg-transparent border border-primary rounded-full pl-10 pr-4 py-2 text-text-main placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={clearSearch}
                            className="p-2 text-text-secondary hover:text-red-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Default View - Always visible on desktop, hidden when search is active on mobile */}
                <div className={`w-full flex items-center justify-between ${isSearchActive ? 'hidden md:flex' : 'flex'}`}>
                    {/* Left: Logo & Residential Badge - Linked to Landing Page */}
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 relative flex items-center justify-center">
                            <img
                                src="/vecivendo_logo_primary.png"
                                alt="Vecivendo Logo"
                                className="w-full h-full object-contain rounded-lg"
                            />
                        </div>
                        {residencialName && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-surface/80 backdrop-blur-sm border border-border rounded-full text-xs md:text-sm font-medium text-text-main shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="truncate max-w-[120px] md:max-w-none">{residencialName}</span>
                            </div>
                        )}
                    </Link>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 md:gap-4 h-full">
                        {/* Desktop View Controls - Hidden on mobile */}
                        {showFilters && (
                            <div className="hidden md:flex items-center gap-3 h-10">
                                <select
                                    value={sortOption}
                                    onChange={(e) => onSortChange(e.target.value)}
                                    className="h-full px-3 bg-background border border-border rounded-lg text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:border-primary/50 transition-colors"
                                >
                                    <option value="recent">Más recientes</option>
                                    <option value="price_asc">Menor precio</option>
                                    <option value="price_desc">Mayor precio</option>
                                </select>

                                <div className="h-full flex items-center bg-background border border-border rounded-lg p-1 gap-1">
                                    <button
                                        onClick={() => handleViewModeChange("grid")}
                                        className={`h-full aspect-square flex items-center justify-center rounded transition-all cursor-pointer border border-transparent ${viewMode === "grid"
                                            ? "bg-surface shadow-sm text-primary"
                                            : "text-text-secondary hover:border-primary hover:text-text-main"
                                            }`}
                                    >
                                        <Grid size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleViewModeChange("list")}
                                        className={`h-full aspect-square flex items-center justify-center rounded transition-all cursor-pointer border border-transparent ${viewMode === "list"
                                            ? "bg-surface shadow-sm text-primary"
                                            : "text-text-secondary hover:border-primary hover:text-text-main"
                                            }`}
                                    >
                                        <List size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-text-secondary hover:text-primary transition-colors rounded-full border border-transparent hover:border-primary cursor-pointer"
                        >
                            {mounted && (theme === 'dark' || (theme === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches))
                                ? <Sun size={20} />
                                : <Moon size={20} />
                            }
                        </button>

                        {/* Favorites */}
                        <Link href={`/${residentialSlug || 'residencial-demo'}/favoritos`} className="p-2 text-text-secondary hover:text-primary transition-colors rounded-full border border-transparent hover:border-primary cursor-pointer">
                            <Heart size={20} />
                        </Link>

                        {/* Cart */}
                        <Link href={`/${residentialSlug || 'residencial-demo'}/cart`} className="p-2 text-text-secondary hover:text-primary transition-colors rounded-full border border-transparent hover:border-primary relative cursor-pointer">
                            <ShoppingCart size={20} />
                            {getCartCount() > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                                    {getCartCount()}
                                </span>
                            )}
                        </Link>

                        {/* Profile - Hidden on mobile as it is in BottomNav */}
                        <Link href={`/${residentialSlug || 'residencial-demo'}/perfil`} className="hidden md:flex p-2 text-text-secondary hover:text-primary transition-colors rounded-full border border-transparent hover:border-primary cursor-pointer">
                            <User size={20} />
                        </Link>

                        {/* Mobile Search - Restored as per user request */}
                        {showSearch && (
                            <button
                                onClick={() => setIsSearchActive(true)}
                                className="md:hidden p-2 text-text-secondary hover:text-primary transition-colors rounded-full border border-transparent hover:border-primary cursor-pointer"
                            >
                                <Search size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

