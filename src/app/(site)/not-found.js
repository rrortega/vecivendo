'use client';

import { Search, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Ilustración */}
                <div className="flex justify-center">
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center relative">
                        <Search className="w-16 h-16 text-primary" />
                        <span className="absolute -bottom-2 -right-2 text-5xl">🔍</span>
                    </div>
                </div>

                {/* Título */}
                <div className="space-y-2">
                    <h1 className="text-6xl font-bold text-primary">404</h1>
                    <h2 className="text-2xl font-bold text-text-main">
                        Página no encontrada
                    </h2>
                    <p className="text-text-secondary">
                        La página que buscas no existe o ha sido movida.
                        Puede que el enlace esté roto o la dirección esté mal escrita.
                    </p>
                </div>

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border text-text-main rounded-full font-medium hover:bg-surface-hover transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver atrás
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Ir al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
