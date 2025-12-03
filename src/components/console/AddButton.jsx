"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function AddButton({ href, label = "Agregar" }) {
    return (
        <>
            {/* Desktop Button */}
            <div className="hidden md:block">
                <Link
                    href={href}
                    className="fixed p-2 bottom-6 right-6 md:static w-14 h-14 md:w-auto md:h-auto rounded-full md:rounded-lg bg-black hover:bg-gray-800 text-white flex items-center justify-center md:gap-2 shadow-lg md:shadow-sm transition-all z-30"
                >
                    <Plus size={20} />
                    <span>{label}</span>
                </Link>
            </div>

            {/* Mobile FAB */}
            <div className="md:hidden fixed bottom-6 right-6 z-[100]">
                <Link
                    href={href}
                    className="fixed p-2 bottom-6 right-6 md:static w-14 h-14 md:w-auto md:h-auto rounded-full md:rounded-lg bg-black hover:bg-gray-800 text-white flex items-center justify-center md:gap-2 shadow-lg md:shadow-sm transition-all z-30"
                    aria-label={label}
                >
                    <Plus size={28} />
                </Link>
            </div>
        </>
    );
}
