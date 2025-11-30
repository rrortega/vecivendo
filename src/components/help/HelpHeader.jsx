'use client';

import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HelpHeader() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        setMounted(true);

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleTheme = () => {
        const currentEffectiveTheme = theme === "system"
            ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
            : theme;

        const newTheme = currentEffectiveTheme === "dark" ? "light" : "dark";
        setTheme(newTheme);
    };

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-background/80 backdrop-blur-md border-b border-border'
                : 'bg-transparent border-b border-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 relative flex items-center justify-center">
                            <img
                                src="/vecivendo_logo_primary.png"
                                alt="Vecivendo Logo"
                                className="w-full h-full object-contain rounded-lg"
                            />
                        </div>
                        <div className="hidden sm:flex items-center px-3 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800">
                            <span className="text-sm font-medium">Centro de ayuda</span>
                        </div>
                    </Link>
                </div>

                <nav className="flex items-center gap-4">


                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors rounded-full border border-transparent hover:border-primary-100 dark:hover:border-primary-800 cursor-pointer"
                        aria-label="Toggle theme"
                    >
                        {mounted && (theme === 'dark' || (theme === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches))
                            ? <Sun size={20} />
                            : <Moon size={20} />
                        }
                    </button>
                </nav>
            </div>
        </header>
    );
}
