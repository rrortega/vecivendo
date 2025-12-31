'use client';

import { useState, useEffect, useCallback } from 'react';

// Convertir la clave VAPID de base64 a Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const usePushNotifications = () => {
    const [permission, setPermission] = useState('default');
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Verificar soporte y estado actual
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const supported = 'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window;

        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);

            // Verificar si ya está suscrito
            navigator.serviceWorker.ready.then((registration) => {
                registration.pushManager.getSubscription().then((sub) => {
                    setIsSubscribed(!!sub);
                    setSubscription(sub);
                });
            });
        }
    }, []);

    // Solicitar permisos y suscribirse
    const subscribe = useCallback(async () => {
        if (!isSupported) {
            setError('Tu navegador no soporta notificaciones push');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Solicitar permiso
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission !== 'granted') {
                setError('Permiso de notificaciones denegado');
                setIsLoading(false);
                return null;
            }

            // Esperar a que el SW esté listo
            const registration = await navigator.serviceWorker.ready;

            // Obtener la clave VAPID pública desde el servidor
            const vapidResponse = await fetch('/api/push/vapid-key');
            if (!vapidResponse.ok) {
                throw new Error('No se pudo obtener la clave VAPID');
            }
            const { publicKey } = await vapidResponse.json();

            if (!publicKey) {
                throw new Error('Clave VAPID no configurada');
            }

            // Suscribirse a push
            const pushSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            setSubscription(pushSubscription);
            setIsSubscribed(true);

            // Enviar la suscripción al servidor para guardarla
            const saveResponse = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: pushSubscription.toJSON(),
                }),
            });

            if (!saveResponse.ok) {
                console.warn('No se pudo guardar la suscripción en el servidor');
            }

            setIsLoading(false);
            return pushSubscription;

        } catch (err) {
            console.error('Error al suscribirse a push:', err);
            setError(err.message || 'Error al activar notificaciones');
            setIsLoading(false);
            return null;
        }
    }, [isSupported]);

    // Cancelar suscripción
    const unsubscribe = useCallback(async () => {
        if (!subscription) return;

        setIsLoading(true);
        setError(null);

        try {
            await subscription.unsubscribe();

            // Notificar al servidor
            await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                }),
            });

            setSubscription(null);
            setIsSubscribed(false);
            setIsLoading(false);

        } catch (err) {
            console.error('Error al cancelar suscripción:', err);
            setError(err.message || 'Error al desactivar notificaciones');
            setIsLoading(false);
        }
    }, [subscription]);

    return {
        isSupported,
        permission,
        isSubscribed,
        subscription,
        isLoading,
        error,
        subscribe,
        unsubscribe,
    };
};
