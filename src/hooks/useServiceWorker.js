'use client';

import { useState, useEffect, useCallback } from 'react';

export const useServiceWorker = () => {
    const [waitingWorker, setWaitingWorker] = useState(null);
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    const registerServiceWorker = useCallback(async () => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            console.log('[SW Hook] Service Workers not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            setIsRegistered(true);
            console.log('[SW Hook] Service Worker registered:', registration.scope);

            // Detectar si hay un SW esperando
            if (registration.waiting) {
                setWaitingWorker(registration.waiting);
                setShowUpdatePrompt(true);
            }

            // Escuchar cuando un nuevo SW está listo para activarse
            registration.addEventListener('waiting', () => {
                if (registration.waiting) {
                    setWaitingWorker(registration.waiting);
                    setShowUpdatePrompt(true);
                }
            });

            // Escuchar actualizaciones
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('[SW Hook] New Service Worker installing...');

                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Hay una nueva versión lista
                            console.log('[SW Hook] New version available!');
                            setWaitingWorker(newWorker);
                            setShowUpdatePrompt(true);
                        }
                    });
                }
            });

            // Verificar actualizaciones periódicamente (cada 60 minutos)
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);

            // Verificar actualizaciones al volver a la pestaña
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    registration.update();
                }
            });

        } catch (error) {
            console.error('[SW Hook] Registration failed:', error);
        }
    }, []);

    // Función para activar la nueva versión
    const updateServiceWorker = useCallback(() => {
        if (waitingWorker) {
            console.log('[SW Hook] Updating Service Worker...');

            // Enviar mensaje al SW para que haga skipWaiting
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });

            // Escuchar cuando el nuevo SW tome control
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[SW Hook] New Service Worker activated, reloading...');
                window.location.reload();
            }, { once: true });

            setShowUpdatePrompt(false);
        }
    }, [waitingWorker]);

    // Función para descartar el prompt
    const dismissUpdatePrompt = useCallback(() => {
        setShowUpdatePrompt(false);
    }, []);

    // Registrar el SW al montar
    useEffect(() => {
        registerServiceWorker();
    }, [registerServiceWorker]);

    return {
        showUpdatePrompt,
        updateServiceWorker,
        dismissUpdatePrompt,
        isRegistered,
    };
};
