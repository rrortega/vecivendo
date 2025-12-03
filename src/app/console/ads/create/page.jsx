"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CreatePaidAdPage() {
    return (
        <div className="p-6">
            <div className="mb-8">
                <Link
                    href="/console/ads"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
                >
                    <ChevronLeft size={20} />
                    <span>Volver a Publicidad</span>
                </Link>
                <h1 className="text-2xl font-bold admin-text">Nueva Publicidad</h1>
                <p className="admin-text-muted mt-1">Crea una nueva campaña de publicidad</p>
            </div>

            <div className="admin-surface p-8 rounded-xl border admin-border text-center">
                <p className="admin-text-muted">El formulario de creación de publicidad estará disponible pronto.</p>
            </div>
        </div>
    );
}
