import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function Header({ residencialName }) {
    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                        <ShoppingBag size={18} />
                    </div>
                    <span className="font-poppins font-bold text-xl text-text-main tracking-tight">
                        Vecivendo
                    </span>
                </Link>

                {residencialName && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-border">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-medium text-text-secondary">
                            {residencialName}
                        </span>
                    </div>
                )}
            </div>
        </header>
    );
}
