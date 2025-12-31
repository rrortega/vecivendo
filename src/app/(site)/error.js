'use client';

import { useEffect } from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { useConnection } from '@/context/ConnectionContext';

export default function Error({ error, reset }) {
    const { reportConnectionError, isOffline } = useConnection();

    useEffect(() => {
        // Reportar el error de conexión al contexto
        if (error?.message?.includes('fetch') ||
            error?.message?.includes('network') ||
            error?.message?.includes('Failed to fetch') ||
            isOffline) {
            reportConnectionError();
        }

        // Log del error para debugging
        console.error('Error capturado:', error);
    }, [error, isOffline, reportConnectionError]);

    // Determinar si es un error de conexión
    const isConnectionError =
        isOffline ||
        error?.message?.includes('fetch') ||
        error?.message?.includes('network') ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('NetworkError');

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Ícono */}
                <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <WifiOff className="w-12 h-12 text-red-500 animate-pulse" />
                    </div>
                </div>

                {/* Título */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-text-main">
                        {isConnectionError
                            ? '¡Ups! Problemas de conexión'
                            : 'Algo salió mal'}
                    </h1>
                    <p className="text-text-secondary">
                        {isConnectionError
                            ? 'Parece que tienes problemas con tu conexión a internet. Revisa tu conexión e intenta nuevamente.'
                            : 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'}
                    </p>
                </div>

                {/* Información adicional para PWA offline */}
                {isConnectionError && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            💡 Algunos contenidos que ya visitaste pueden estar disponibles sin conexión.
                        </p>
                    </div>
                )}

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reintentar
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border text-text-main rounded-full font-medium hover:bg-surface-hover transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Ir al inicio
                    </Link>
                </div>

                {/* Mensaje de estado */}
                <p className="text-xs text-text-tertiary">
                    {isOffline ? 'Estado: Sin conexión' : 'Estado: Conectado (posible error de servidor)'}
                </p>
            </div>
        </div>
    );
}
