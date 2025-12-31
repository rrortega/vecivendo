'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const ConnectionContext = createContext({
    isOffline: false,
    showOfflineMessage: false,
    dismissMessage: () => { },
    reportConnectionError: () => { },
});

export const useConnection = () => {
    const context = useContext(ConnectionContext);
    if (!context) {
        throw new Error('useConnection debe usarse dentro de un ConnectionProvider');
    }
    return context;
};

export const ConnectionProvider = ({ children }) => {
    const [isOffline, setIsOffline] = useState(false);
    const [hasConnectionError, setHasConnectionError] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const snoozeTimeoutRef = useRef(null);

    // La notificación se muestra si hay offline O error de conexión, y no está descartada
    const showOfflineMessage = (isOffline || hasConnectionError) && !isDismissed;

    useEffect(() => {
        // Set initial state (safe for SSR/hydration)
        setIsOffline(!navigator.onLine);

        const handleOffline = () => {
            setIsOffline(true);
            setIsDismissed(false); // Resetear dismiss cuando se detecta offline
        };

        const handleOnline = () => {
            setIsOffline(false);
            setHasConnectionError(false); // Limpiar errores cuando hay conexión
            setIsDismissed(false);
            // Limpiar timeout si existe
            if (snoozeTimeoutRef.current) {
                clearTimeout(snoozeTimeoutRef.current);
                snoozeTimeoutRef.current = null;
            }
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            if (snoozeTimeoutRef.current) {
                clearTimeout(snoozeTimeoutRef.current);
            }
        };
    }, []);

    // Función para descartar temporalmente el mensaje
    const dismissMessage = useCallback(() => {
        setIsDismissed(true);

        // Limpiar timeout anterior si existe
        if (snoozeTimeoutRef.current) {
            clearTimeout(snoozeTimeoutRef.current);
        }

        // Re-mostrar después de 20 segundos si sigue sin conexión
        snoozeTimeoutRef.current = setTimeout(() => {
            // Verificar si sigue sin conexión antes de mostrar de nuevo
            if (!navigator.onLine) {
                setIsDismissed(false);
            } else {
                // Si ya hay conexión, limpiar estado
                setHasConnectionError(false);
            }
        }, 20000); // 20 segundos
    }, []);

    // Función para reportar errores de conexión/servidor
    const reportConnectionError = useCallback(() => {
        setHasConnectionError(true);
        setIsDismissed(false);
    }, []);

    return (
        <ConnectionContext.Provider value={{
            isOffline,
            showOfflineMessage,
            dismissMessage,
            reportConnectionError
        }}>
            {children}
        </ConnectionContext.Provider>
    );
};

