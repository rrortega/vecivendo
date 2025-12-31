'use client';

import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Componente que solicita automáticamente permisos de push notifications
// Se monta silenciosamente y no muestra UI
export const AutoPushSubscribe = () => {
    const { isSupported, permission, isSubscribed, subscribe } = usePushNotifications();
    const hasAttempted = useRef(false);

    useEffect(() => {
        // Solo intentar una vez por sesión
        if (hasAttempted.current) return;

        // Si no hay soporte o ya está suscrito, no hacer nada
        if (!isSupported || isSubscribed) return;

        // Si el permiso ya fue denegado, no molestar
        if (permission === 'denied') return;

        // Esperar un momento para no bloquear el render inicial
        const timer = setTimeout(async () => {
            hasAttempted.current = true;

            try {
                // Solicitar suscripción (esto mostrará el prompt del navegador)
                await subscribe();
                console.log('[AutoPush] Successfully subscribed to push notifications');
            } catch (error) {
                console.log('[AutoPush] Failed to subscribe:', error);
            }
        }, 3000); // Esperar 3 segundos después de cargar

        return () => clearTimeout(timer);
    }, [isSupported, isSubscribed, permission, subscribe]);

    // Este componente no renderiza nada visible
    return null;
};
