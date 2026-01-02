'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PushSubscriptionModal } from './PushSubscriptionModal';

// Clave para almacenar cuándo podemos volver a preguntar
const PUSH_NEXT_PROMPT_KEY = 'vecivendo_push_next_prompt';
// Tiempos de espera
const COOLDOWN_DECLINE_MS = 48 * 60 * 60 * 1000; // 48 horas si declina explícitamente
const COOLDOWN_CLOSE_MS = 8 * 60 * 60 * 1000;    // 8 horas si solo cierra el modal

/**
 * Componente que gestiona la suscripción automática a push notifications
 * 
 * Flujo:
 * 1. Verifica si el usuario tiene teléfono verificado
 * 2. Consulta al BFF si ya tiene un push target registrado
 * 3. Si no está registrado, muestra modal de solicitud
 * 4. Si el usuario rechaza, no pregunta de nuevo por 48 horas
 * 5. Si acepta, solicita permiso del dispositivo y registra el token
 */
export const AutoPushSubscribe = () => {
    const pathname = usePathname();
    const { isSupported, permission, isSubscribed, subscribe, subscription } = usePushNotifications();

    const [showModal, setShowModal] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState(null);

    const hasCheckedRef = useRef(false);
    const userDataRef = useRef(null);

    // Guarda de seguridad: Nunca ejecutar en la consola de administración
    if (pathname?.startsWith('/console')) {
        return null;
    }

    /**
     * Verifica si debemos mostrar el modal basado en el tiempo de espera
     */
    const isWaitPeriodActive = useCallback(() => {
        try {
            const nextPrompt = localStorage.getItem(PUSH_NEXT_PROMPT_KEY);
            if (!nextPrompt) return false;

            const nextPromptDate = parseInt(nextPrompt, 10);
            const now = Date.now();

            return now < nextPromptDate;
        } catch {
            return false;
        }
    }, []);

    /**
     * Registra el tiempo de espera
     */
    const setNextPromptTime = useCallback((ms) => {
        try {
            const nextTime = Date.now() + ms;
            localStorage.setItem(PUSH_NEXT_PROMPT_KEY, nextTime.toString());
        } catch (e) {
            console.error('[AutoPush] Error saving next prompt timestamp:', e);
        }
    }, []);

    /**
     * Limpia el registro de tiempo de espera
     */
    const clearCooldown = useCallback(() => {
        try {
            localStorage.removeItem(PUSH_NEXT_PROMPT_KEY);
        } catch (e) {
            console.error('[AutoPush] Error clearing cooldown:', e);
        }
    }, []);

    /**
     * Obtiene los datos del usuario del localStorage
     */
    const getUserData = useCallback(() => {
        try {
            const globalProfileData = localStorage.getItem('vecivendo_user_global');
            if (!globalProfileData) return null;

            const userData = JSON.parse(globalProfileData);

            // El userId es el telefono sin el signo + (según requerimiento)
            let userId = userData.userId;
            if (!userId && userData.telefono) {
                userId = userData.telefono.replace(/\D/g, '');
            }

            // Normalización para México (Appwrite usa 521 + 10 dígitos)
            if (userId && userId.startsWith('52') && userId.length === 12 && !userId.startsWith('521')) {
                userId = '521' + userId.substring(2);
            }

            return {
                telefono: userData.telefono,
                telefono_verificado: userData.telefono_verificado,
                userId: userId
            };
        } catch (e) {
            console.error('[AutoPush] Error parsing user data:', e);
            return null;
        }
    }, []);

    /**
     * Verifica con el BFF si el usuario ya tiene push target registrado
     */
    const checkPushSubscription = useCallback(async (userId, phone) => {
        try {
            const params = new URLSearchParams();
            if (userId) params.append('userId', userId);
            if (phone) params.append('phone', phone);

            const response = await fetch(`/api/push/check-subscription?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Error verificando suscripción');
            }

            const data = await response.json();
            return data.isSubscribed;
        } catch (e) {
            console.error('[AutoPush] Error checking subscription:', e);
            return false;
        }
    }, []);

    /**
     * Registra el push target en el servidor
     */
    const registerPushTarget = useCallback(async (userId, phone, token) => {
        try {
            const response = await fetch('/api/push/register-target', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, phone, token }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error registrando push target');
            }

            const data = await response.json();
            console.log('[AutoPush] Target registrado:', data);
            return data;
        } catch (e) {
            console.error('[AutoPush] Error registering target:', e);
            throw e;
        }
    }, []);

    /**
     * Efecto principal: verificar estado del usuario
     */
    useEffect(() => {
        // Solo ejecutar una vez
        if (hasCheckedRef.current) return;

        // Si no hay soporte de push, no hacer nada
        if (!isSupported) return;

        // Si el permiso ya fue denegado en el navegador, no molestar
        if (permission === 'denied') return;

        // Esperar un momento para no bloquear el render inicial
        const timer = setTimeout(async () => {
            hasCheckedRef.current = true;

            // Obtener datos del usuario
            const userData = getUserData();

            // Si no hay datos de usuario o no tiene teléfono verificado, no hacer nada
            if (!userData || !userData.telefono_verificado || !userData.telefono) {
                console.log('[AutoPush] Usuario sin teléfono verificado');
                return;
            }

            // Guardar referencia para uso posterior
            userDataRef.current = userData;

            // Si estamos en periodo de espera, no mostrar modal
            if (isWaitPeriodActive()) {
                console.log('[AutoPush] Periodo de espera activo, posponiendo verificación');
                return;
            }

            setIsChecking(true);

            try {
                // Verificar si ya tiene push target registrado
                const hasTarget = await checkPushSubscription(userData.userId, userData.telefono);

                if (hasTarget) {
                    console.log('[AutoPush] Usuario ya tiene push target registrado');
                    setIsChecking(false);
                    return;
                }

                // Si también ya está suscrito localmente, intentar registrar el target
                if (isSubscribed && subscription) {
                    console.log('[AutoPush] Suscrito localmente pero sin target, registrando...');
                    try {
                        // Obtener el token FCM del endpoint
                        const endpoint = subscription.endpoint;
                        // El token suele estar al final del endpoint para FCM
                        const token = endpoint.split('/').pop();

                        await registerPushTarget(userData.userId, userData.telefono, token);
                        console.log('[AutoPush] Target registrado exitosamente');
                    } catch (e) {
                        console.error('[AutoPush] Error registrando target existente:', e);
                    }
                    setIsChecking(false);
                    return;
                }

                console.log('[AutoPush] No hay push target, mostrando modal');
                setShowModal(true);

            } catch (e) {
                console.error('[AutoPush] Error en verificación:', e);
            } finally {
                setIsChecking(false);
            }
        }, 3000); // Esperar 3 segundos después de cargar

        return () => clearTimeout(timer);
    }, [isSupported, isSubscribed, permission, subscription, getUserData, checkPushSubscription, registerPushTarget, isWaitPeriodActive]);

    /**
     * Maneja cuando el usuario acepta las notificaciones
     */
    const handleAccept = async () => {
        const userData = userDataRef.current;
        if (!userData) {
            setError('No se encontraron datos del usuario');
            return;
        }

        setIsRegistering(true);
        setError(null);

        try {
            // Solicitar permiso y suscribirse
            const pushSubscription = await subscribe();

            if (!pushSubscription) {
                setError('No se pudo activar las notificaciones. Verifica los permisos de tu navegador.');
                setIsRegistering(false);
                return;
            }

            // Obtener el token FCM
            const endpoint = pushSubscription.endpoint;
            const token = endpoint.split('/').pop();

            // Registrar el target en el servidor
            await registerPushTarget(userData.userId, userData.telefono, token);

            // Limpiar el cooldown
            clearCooldown();

            console.log('[AutoPush] ¡Suscripción completada exitosamente!');
            setShowModal(false);

        } catch (e) {
            console.error('[AutoPush] Error en suscripción:', e);
            setError(e.message || 'Error al activar notificaciones');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleDecline = () => {
        console.log('[AutoPush] Usuario declinó explícitamente, no preguntar por 48h');
        setNextPromptTime(COOLDOWN_DECLINE_MS);
        setShowModal(false);
    };

    /**
     * Cierra el modal (Posponer 8 horas)
     */
    const handleClose = () => {
        console.log('[AutoPush] Modal cerrado por el usuario, posponer 8h');
        setNextPromptTime(COOLDOWN_CLOSE_MS);
        setShowModal(false);
    };

    // Renderizar el modal si está abierto
    return (
        <PushSubscriptionModal
            isOpen={showModal}
            onClose={handleClose}
            onAccept={handleAccept}
            onDecline={handleDecline}
            isLoading={isRegistering}
            error={error}
        />
    );
};
