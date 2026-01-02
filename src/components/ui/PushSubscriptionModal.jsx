'use client';

import { useState } from 'react';
import { Bell, X, AlertCircle } from 'lucide-react';

/**
 * Modal para solicitar al usuario que se suscriba a notificaciones push
 * Se muestra cuando el usuario tiene teléfono verificado pero no tiene push target
 */
export const PushSubscriptionModal = ({
    isOpen,
    onClose,
    onAccept,
    onDecline,
    isLoading = false,
    error = null
}) => {
    if (!isOpen) return null;

    const handleClose = () => {
        onClose?.();
    };

    const handleDecline = () => {
        onDecline?.();
        onClose?.();
    };

    const handleAccept = async () => {
        await onAccept?.();
    };

    return (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-surface rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-300 overflow-hidden">
                {/* Header con gradiente */}
                <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 py-8 text-white">
                    {/* Botón cerrar */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                        disabled={isLoading}
                    >
                        <X size={20} />
                    </button>

                    {/* Icono animado */}
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                            <div className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                                <Bell className="w-10 h-10 text-white" />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-center">
                        Activa las notificaciones
                    </h2>
                    <p className="text-white/80 text-center text-sm mt-2">
                        Mantente al día con tu comunidad
                    </p>
                </div>

                {/* Contenido */}
                <div className="p-6">
                    <div className="space-y-4 mb-6">
                        <p className="text-text-secondary text-center">
                            Para no perderte actualizaciones importantes sobre:
                        </p>

                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span className="text-text-main text-sm">
                                    <strong>Anuncios de tu interés</strong> — Recibe alertas cuando publiquen algo que buscas
                                </span>
                            </li>
                            <li className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span className="text-text-main text-sm">
                                    <strong>Actividad de tu cuenta</strong> — Mensajes, respuestas y actualizaciones
                                </span>
                            </li>
                            <li className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span className="text-text-main text-sm">
                                    <strong>Novedades del residencial</strong> — Alertas comunitarias importantes
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleAccept}
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Activando...</span>
                                </>
                            ) : (
                                <>
                                    <Bell className="w-5 h-5" />
                                    <span>Activar notificaciones</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleDecline}
                            disabled={isLoading}
                            className="w-full py-3 px-4 text-text-secondary font-medium rounded-xl hover:bg-surface-hover transition-colors disabled:opacity-50"
                        >
                            Ahora no
                        </button>
                    </div>

                    {/* Nota */}
                    <p className="text-xs text-text-secondary/70 text-center mt-4">
                        Puedes cambiar esto en cualquier momento desde tu perfil
                    </p>
                </div>
            </div>
        </div>
    );
};
