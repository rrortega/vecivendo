'use client';

import { Bell, BellOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationToggle = ({ className = '' }) => {
    const {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
    } = usePushNotifications();

    // No mostrar si no está soportado
    if (!isSupported) {
        return null;
    }

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    // Si el permiso fue denegado permanentemente
    if (permission === 'denied') {
        return (
            <div className={`flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 ${className}`}>
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Notificaciones bloqueadas
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                        Habilítalas desde la configuración de tu navegador
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-3 p-4 bg-surface rounded-xl border border-border ${className}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isSubscribed
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main">
                    Notificaciones push
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                    {isSubscribed
                        ? 'Recibirás alertas de nuevos anuncios y mensajes'
                        : 'Activa para recibir alertas importantes'}
                </p>
                {error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
            </div>

            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isSubscribed
                        ? 'bg-gray-100 dark:bg-gray-800 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="sr-only">Cargando...</span>
                    </>
                ) : isSubscribed ? (
                    'Desactivar'
                ) : (
                    'Activar'
                )}
            </button>
        </div>
    );
};

// Versión compacta para usar en menús o headers
export const PushNotificationButton = ({ className = '' }) => {
    const {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe,
    } = usePushNotifications();

    if (!isSupported || permission === 'denied') {
        return null;
    }

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`p-2 rounded-full transition-colors ${isSubscribed
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                } ${className}`}
            title={isSubscribed ? 'Desactivar notificaciones' : 'Activar notificaciones'}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSubscribed ? (
                <Bell className="w-5 h-5" />
            ) : (
                <BellOff className="w-5 h-5" />
            )}
        </button>
    );
};
