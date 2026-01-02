'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFirebaseMessaging } from '@/lib/firebase';

export const usePushNotifications = () => {
    const [permission, setPermission] = useState('default');
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState(null); // Ahora guardaremos el token aquí
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

            // Verificar si ya tenemos un token en localStorage (opcional, pero mejor usar la SDK)
            navigator.serviceWorker.ready.then(async (registration) => {
                const sub = await registration.pushManager.getSubscription();
                setIsSubscribed(!!sub);
            });
        }
    }, []);

    // Solicitar permisos y obtener Token v2 (Firebase SDK)
    const subscribe = useCallback(async () => {
        if (!isSupported) {
            setError('Tu navegador no soporta notificaciones push');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Solicitar permiso nativo
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                setError('Permiso de notificaciones denegado');
                setIsLoading(false);
                return null;
            }

            // 2. Obtener clave VAPID
            const vapidResponse = await fetch('/api/push/vapid-key');
            const { publicKey } = await vapidResponse.json();

            if (!publicKey) throw new Error('Clave VAPID no configurada');

            // 3. Inicializar Firebase Messaging
            const messaging = await getFirebaseMessaging();
            const serviceWorkerRegistration = await navigator.serviceWorker.ready;

            // 4. Obtener Token oficial de Firebase
            const { getToken } = await import('firebase/messaging');
            const token = await getToken(messaging, {
                vapidKey: publicKey,
                serviceWorkerRegistration: serviceWorkerRegistration
            });

            if (!token) throw new Error('No se pudo generar el token de Firebase');

            console.log('[Push] Token de Firebase generado con éxito');

            // Simular objeto de suscripción para mantener compatibilidad con el resto del código
            const pseudoSubscription = {
                endpoint: `https://fcm.googleapis.com/fcm/send/${token}`,
                token: token
            };

            setSubscription(pseudoSubscription);
            setIsSubscribed(true);

            // 5. Notificar al servidor (opcional si ya lo hace AutoPushSubscribe)
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: pseudoSubscription }),
            });

            setIsLoading(false);
            return pseudoSubscription;

        } catch (err) {
            console.error('Error al suscribirse con Firebase SDK:', err);
            setError(err.message || 'Error al activar notificaciones');
            setIsLoading(false);
            return null;
        }
    }, [isSupported]);

    // Cancelar suscripción
    const unsubscribe = useCallback(async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            if (sub) await sub.unsubscribe();

            setSubscription(null);
            setIsSubscribed(false);
        } catch (err) {
            console.error('Error al cancelar:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
