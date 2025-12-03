"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
    X,
    LayoutDashboard,
    Megaphone,
    TrendingUp,
    Building2,
    MessageSquare,
    MessageCircle,
    Settings,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    LogOut,
    Tag,
    FileText
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navItems = [
        { name: "Tablero", href: "/console/dashboard", icon: LayoutDashboard },
        { name: "Residenciales", href: "/console/residentials", icon: Building2 },
        { name: "Anuncios", href: "/console/free-ads", icon: Megaphone },
        { name: "Categorías", href: "/console/categories", icon: Tag },
        { name: "Contenidos", href: "/console/contents", icon: FileText },
        { name: "Publicidad", href: "/console/ads", icon: TrendingUp },
        { name: "Grupos WhatsApp", href: "/console/whatsapp", icon: MessageCircle },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed md:static inset-y-0 left-0 z-50
                ${isCollapsed ? "w-20" : "w-64"} admin-surface admin-text h-screen flex flex-col
                transition-all duration-300 ease-in-out border-r admin-border md:relative
                ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}>
                {/* Collapse/Expand Button - Always visible on desktop */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex absolute top-1/2 -right-4 admin-surface rounded-full p-2 shadow-lg hover:shadow-xl transition-all z-20 border admin-border"
                    title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
                >
                    {isCollapsed ? (
                        <ChevronRight size={20} className="admin-text" />
                    ) : (
                        <ChevronLeft size={20} className="admin-text" />
                    )}
                </button>

                {/* Logo */}
                <div className="p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/vecivendo_logo_primary.png"
                            alt="Vecivendo Logo"
                            width={54}
                            height={54}
                            className="grayscale opacity-70 rounded-lg"
                        />
                        {!isCollapsed && (
                            <div>
                                <h1 className="text-2xl font-bold text-primary-500">Vecivendo</h1>
                                <p className="text-xs admin-text-muted mt-1">Admin Console</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden admin-text-muted hover:admin-text transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => onClose && onClose()}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive
                                    ? "admin-text border-2 border-primary-500 bg-primary-50 dark:bg-primary-600 dark:text-white dark:border-transparent"
                                    : "admin-text-muted admin-hover"
                                    }`}
                                title={isCollapsed ? item.name : ""}
                            >
                                <Icon size={20} className="flex-shrink-0" />
                                {!isCollapsed && <span>{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t admin-border space-y-2">
                    {/* Configuración */}
                    <Link
                        href="/console/configurations"
                        onClick={() => onClose && onClose()}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${pathname === "/console/configurations"
                            ? "admin-text border-2 border-primary-500 bg-primary-50 dark:bg-primary-600 dark:text-white dark:border-transparent"
                            : "admin-text-muted admin-hover"
                            }`}
                        title={isCollapsed ? "Configuración" : ""}
                    >
                        <Settings size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span>Configuración</span>}
                    </Link>

                    {/* Theme Toggle */}
                    <ThemeToggle isCollapsed={isCollapsed} />

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="w-full px-4 py-2 text-sm text-red-500 hover:text-red-600 admin-hover rounded-lg transition-colors flex items-center gap-3"
                        title={isCollapsed ? "Cerrar Sesión" : ""}
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </div>
        </>
    );
};

const ThemeToggle = ({ isCollapsed }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="w-full px-4 py-2 text-sm admin-text-muted admin-hover rounded-lg transition-colors flex items-center gap-3"
            title={isCollapsed ? (isDark ? "Modo Claro" : "Modo Oscuro") : ""}
        >
            {isDark ? (
                <>
                    <Sun size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>Modo Claro</span>}
                </>
            ) : (
                <>
                    <Moon size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>Modo Oscuro</span>}
                </>
            )}
        </button>
    );
};

export default Sidebar;
