'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PushSubscriptionModal } from './PushSubscriptionModal';

// Clave para almacenar la fecha del último decline
const PUSH_DECLINE_KEY = 'vecivendo_push_decline_timestamp';
// Tiempo de espera antes de volver a preguntar (48 horas en ms)
const DECLINE_COOLDOWN_MS = 48 * 60 * 60 * 1000;

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
    const { isSupported, permission, isSubscribed, subscribe, subscription } = usePushNotifications();

    const [showModal, setShowModal] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState(null);

    const hasCheckedRef = useRef(false);
    const userDataRef = useRef(null);

    /**
     * Verifica si el usuario ha declinado recientemente
     */
    const hasDeclinedRecently = useCallback(() => {
        try {
            const declineTimestamp = localStorage.getItem(PUSH_DECLINE_KEY);
            if (!declineTimestamp) return false;

            const declineDate = parseInt(declineTimestamp, 10);
            const now = Date.now();
            const timeSinceDecline = now - declineDate;

            return timeSinceDecline < DECLINE_COOLDOWN_MS;
        } catch {
            return false;
        }
    }, []);

    /**
     * Registra que el usuario ha declinado
     */
    const markAsDeclined = useCallback(() => {
        try {
            localStorage.setItem(PUSH_DECLINE_KEY, Date.now().toString());
        } catch (e) {
            console.error('[AutoPush] Error saving decline timestamp:', e);
        }
    }, []);

    /**
     * Limpia el registro de decline (cuando el usuario acepta)
     */
    const clearDecline = useCallback(() => {
        try {
            localStorage.removeItem(PUSH_DECLINE_KEY);
        } catch (e) {
            console.error('[AutoPush] Error clearing decline timestamp:', e);
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
            return {
                telefono: userData.telefono,
                telefono_verificado: userData.telefono_verificado,
                userId: userData.userId
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

            // Si el usuario ha declinado recientemente, no mostrar modal
            if (hasDeclinedRecently()) {
                console.log('[AutoPush] Usuario declinó recientemente, esperando 48h');
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
    }, [isSupported, isSubscribed, permission, subscription, getUserData, checkPushSubscription, registerPushTarget, hasDeclinedRecently]);

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

            // Limpiar el decline timestamp
            clearDecline();

            console.log('[AutoPush] ¡Suscripción completada exitosamente!');
            setShowModal(false);

        } catch (e) {
            console.error('[AutoPush] Error en suscripción:', e);
            setError(e.message || 'Error al activar notificaciones');
        } finally {
            setIsRegistering(false);
        }
    };

    /**
     * Maneja cuando el usuario declina
     */
    const handleDecline = () => {
        console.log('[AutoPush] Usuario declinó, no preguntar por 48h');
        markAsDeclined();
        setShowModal(false);
    };

    /**
     * Cierra el modal
     */
    const handleClose = () => {
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
