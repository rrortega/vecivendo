"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Lock, Smartphone, X, Loader2, CheckCircle, Navigation, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

import { useTheme } from "@/context/ThemeContext";
import { countries } from "@/data/countries";
import { OtpInput } from "@/components/ui/OtpInput";
import { account } from "@/lib/appwrite";

// Dynamically import the Map component to avoid SSR issues
const LeafletMap = dynamic(() => import("./LeafletMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Cargando mapa...</div>
});

export const AccessModal = ({ isOpen, onClose, residential }) => {
    const { theme } = useTheme();
    const [step, setStep] = useState("intro"); // intro | verifying | success | denied | phone_input | otp_input
    const [userLocation, setUserLocation] = useState(null);
    const [error, setError] = useState(null);
    const [phone, setPhone] = useState("");
    const [countryCode, setCountryCode] = useState("+52");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [verificationStatus, setVerificationStatus] = useState('idle'); // idle | searching | found
    const [redirectCountdown, setRedirectCountdown] = useState(0); // Countdown para redirección
    const isModalOpenRef = useRef(false); // Rastrear si el modal está abierto
    const countdownIntervalRef = useRef(null); // Rastrear el intervalo del countdown

    useEffect(() => {
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        }
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };
    const router = useRouter();


    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            isModalOpenRef.current = true; // Marcar modal como abierto
            // Reiniciar todos los estados cuando el modal se abre
            setStep("intro");
            setUserLocation(null);
            setError(null);
            setPhone("");
            setCountryCode("+52");
            setOtp("");
            setIsLoading(false);
            setTimeLeft(0);
            setVerificationStatus('idle');
            setRedirectCountdown(0);
        } else {
            isModalOpenRef.current = false; // Marcar modal como cerrado
            // Limpiar intervalo si existe
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
            }
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !residential) return null;

    // Residential coordinates (fallback if missing)
    const resLat = residential.ubicacion_centro_lat || 21.08264694485578;
    const resLng = residential.ubicacion_centro_lng || -86.88846368188682;
    const maxRadius = residential.radio_autorizado_metros || 1609;

    const handleStartVerification = () => {
        setStep("verifying");
        setError(null);

        if (!navigator.geolocation) {
            setError("Tu navegador no soporta geolocalización.");
            setStep("denied");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                setUserLocation([userLat, userLng]);

                // Calculate distance
                const R = 6371e3;
                const φ1 = userLat * Math.PI / 180;
                const φ2 = resLat * Math.PI / 180;
                const Δφ = (resLat - userLat) * Math.PI / 180;
                const Δλ = (resLng - userLng) * Math.PI / 180;

                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                setTimeout(() => {
                    if (distance <= maxRadius) {
                        setStep("success");
                        // Persist access with timestamp and coords for background checks
                        const grantedAccess = JSON.parse(localStorage.getItem("granted_access") || "[]");
                        const newRecord = {
                            slug: residential.slug,
                            timestamp: new Date().getTime(),
                            lat: resLat,
                            lng: resLng,
                            radius: maxRadius,
                            method: 'geo'
                        };

                        // Save user's specific location for profile update checks
                        if (userLocation) {
                            localStorage.setItem("latest_user_location", JSON.stringify({
                                lat: userLocation[0],
                                lng: userLocation[1],
                                timestamp: new Date().getTime()
                            }));
                        }

                        // Remove old record if exists and add new one
                        const updatedAccess = grantedAccess.filter(r => r.slug !== residential.slug);
                        localStorage.setItem("granted_access", JSON.stringify([...updatedAccess, newRecord]));

                        // Iniciar countdown de 3 segundos
                        setRedirectCountdown(3);
                        let countdown = 3;
                        const countdownInterval = setInterval(() => {
                            countdown -= 1;
                            setRedirectCountdown(countdown);
                            if (countdown <= 0) {
                                clearInterval(countdownInterval);
                            }
                        }, 1000);

                        setTimeout(() => {
                            // Solo redirigir si el modal sigue abierto
                            if (isModalOpenRef.current) {
                                router.push(`/${residential.slug}`);
                            }
                        }, 3000);
                    } else {
                        setStep("denied");
                    }
                }, 2000); // Wait a bit to show the map animation
            },
            (err) => {
                console.error(err);
                setError("No pudimos obtener tu ubicación. Asegúrate de permitir el acceso.");
                setStep("denied");
            }
        );
    };

    const handleWhatsappValidation = async () => {
        setError(null);
        setIsLoading(true);
        setVerificationStatus('searching');

        try {
            const globalProfileData = JSON.parse(localStorage.getItem("vecivendo_user_global") ?? '{}');

            if (globalProfileData && globalProfileData?.telefono_verificado) {
                const response = await fetch('/api/verify-phone', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: globalProfileData.telefono,
                        residential_id: residential.$id,
                        only_whatsapp: true
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    setVerificationStatus('found');
                    setTimeLeft(5000); // 5 seconds for success countdown

                    // Start countdown logic
                    const interval = setInterval(() => {
                        setTimeLeft((prev) => {
                            if (prev <= 1000) {
                                clearInterval(interval);
                                // Solo ejecutar saveAccess si el modal sigue abierto
                                if (isModalOpenRef.current) {
                                    saveAccess(residential.id);
                                }
                                return 0;
                            }
                            return prev - 1000;
                        });
                    }, 1000);

                    // Guardar referencia del intervalo para limpiarlo si se cierra el modal
                    countdownIntervalRef.current = interval;
                } else {
                    setVerificationStatus('idle');
                    setError(data.error || "No pudimos validar tu acceso en el grupo.");
                }
            } else {
                setVerificationStatus('idle');
                setStep("phone_input");
            }
        } catch (err) {
            console.error(err);
            setVerificationStatus('idle');
            setError("Ocurrió un error al intentar validar.");
        } finally {
            setIsLoading(false);
        }
    };

    const requestVerification = async (phoneNumber) => {
        setIsLoading(true);
        setError(null);
        setVerificationStatus('searching');

        try {
            const response = await fetch('/api/verify-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phoneNumber,
                    residential_id: residential.$id
                })
            });

            const data = await response.json();

            if (response.ok || response.status === 201) {
                setVerificationStatus('found');
                setTimeout(() => {
                    setStep("otp_input");
                    setTimeLeft(300); // 5 minutes cooldown
                    // No reseteamos verificationStatus a 'idle' aquí para que el usuario pueda ver el cambio de UI si vuelve atrás? 
                    // Mejor resetearlo al cambiar de step o dejarlo en found si queremos mantener el mapa oculto en otp step.
                    // Pero en otp step, la UI del mapa sigue ahí? 
                    // El layout muestra el mapa arriba siempre. En otp_input, el mapa sigue visible. 
                    // El usuario dijo "cambia todo por un CHECK verde grande en el modal".
                    // Asumiré que en 'otp_input' queremos volver a mostrar el mapa o mantener el check? 
                    // Si pasamos a OTP input, usualmente queremos ver el contexto. 
                    // Pero la instrucción dice "Si aparece entonces es que esta y cambia todo por un CHECK vertde...".
                    // Luego ingresa el OTP.
                    // Voy a mantener el estado 'found' visible por 2.5s y luego pasar a OTP, y en OTP tal vez resetear status a 'idle' para mostrar mapa o dejarlo limpio.
                    // Decisión: Resetear a 'idle' al pasar a OTP para que el usuario se enfoque en el input, o dejar una UI limpia. 
                    // Si dejo 'found', el mapa no se ve. Si reseteo, el mapa vuelve.
                    // Voy a resetearlo a 'idle' al entrar a OTP para que la experiencia sea fluida, 
                    // PERO el usuario pidió ver el check verde Y el mensaje. Eso dura unos segundos.
                    setVerificationStatus('idle');
                }, 2500);
            } else {
                setVerificationStatus('idle');
                setError(data.error || "Error al solicitar verificación.");
            }
        } catch (err) {
            setVerificationStatus('idle');
            setError("Error de conexión.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setIsLoading(true);
        setError(null);
        const fullPhone = `${countryCode}${phone}`;
        try {
            const response = await fetch('/api/verify-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: fullPhone,
                    residential_id: residential.$id,
                    code: otp
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("vecivendo_user_global", JSON.stringify({ "nombre": "", "telefono": fullPhone, "telefono_verificado": true, "photo": null }));

                // --- APPWRITE SESSION ---
                if (data.appwriteSecret && data.appwriteUserId) {
                    try {
                        console.log("🔐 Creando sesión de Appwrite...");
                        await account.createSession(data.appwriteUserId, data.appwriteSecret);
                        console.log("✅ Sesión de Appwrite iniciada correctamente");
                    } catch (appError) {
                        console.error("❌ Error al crear sesión de Appwrite:", appError);
                    }
                }

                setStep("success");
                saveAccess(residential.id);
            } else {
                setError(data.error || "Código incorrecto.");
            }
        } catch (err) {
            setError("Error al verificar código.");
        } finally {
            setIsLoading(false);
        }
    };

    const saveAccess = (resId) => {
        const grantedAccess = JSON.parse(localStorage.getItem("granted_access") || "[]");

        const newRecord = {
            slug: residential.slug,
            timestamp: new Date().getTime(),
            lat: resLat,
            lng: resLng,
            radius: maxRadius,
            method: 'phone'
        };

        const updatedAccess = grantedAccess.filter(r => r.slug !== residential.slug);
        localStorage.setItem("granted_access", JSON.stringify([...updatedAccess, newRecord]));

        setTimeout(() => {
            // Solo redirigir si el modal sigue abierto
            if (isModalOpenRef.current) {
                router.push(`/${residential.slug}`);
            }
        }, 2000);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-surface w-full h-full md:h-auto md:max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-border flex flex-col md:max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="bg-primary/5 p-4 flex items-center justify-between border-b border-border shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center overflow-hidden">
                                <img src={residential.image} alt={residential.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-main">{residential.name}</h3>
                                <p className="text-xs text-text-secondary">Verificación de Acceso</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-text-secondary hover:text-text-main p-2 rounded-full hover:bg-black/5">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Map Area */}
                    <div className="relative w-full flex-1 md:flex-none md:h-80 bg-gray-100 min-h-[250px]">
                        {verificationStatus === 'idle' && (
                            <LeafletMap
                                center={[resLat, resLng]}
                                zoom={14}
                                radius={maxRadius}
                                residentialName={residential.name}
                                userLocation={userLocation}
                            />
                        )}

                        {verificationStatus === 'searching' && (
                            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-50">
                                <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                                    <div className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg relative z-10">
                                        <Smartphone className="w-8 h-8 text-white" />
                                    </div>
                                    <motion.div
                                        className="absolute inset-0 z-20"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    >
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md border border-gray-100">
                                            <Search className="w-5 h-5 text-gray-500" />
                                        </div>
                                    </motion.div>
                                </div>
                                <p className="font-medium text-text-main animate-pulse text-lg">Buscando en el grupo...</p>
                            </div>
                        )}

                        {verificationStatus === 'found' && (
                            <div className="absolute inset-0 bg-green-50 flex flex-col items-center justify-center z-50 animate-in fade-in duration-300">
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 text-white shadow-xl shadow-green-200"
                                >
                                    <CheckCircle className="w-12 h-12" strokeWidth={3} />
                                </motion.div>
                                <motion.p
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    delay={0.2}
                                    className="font-bold text-green-700 text-xl text-center px-8 leading-tight"
                                >
                                    Celular encontrado en el grupo privado del residencial
                                </motion.p>
                            </div>
                        )}

                        {/* Overlay Messages for Geolocation */}
                        {verificationStatus === 'idle' && (
                            <div className="absolute bottom-4 left-4 right-4 z-[400]">
                                {step === "verifying" && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg flex items-center gap-3"
                                    >
                                        <Loader2 className="animate-spin text-primary" />
                                        <span className="text-sm font-medium">Verificando tu ubicación...</span>
                                    </motion.div>
                                )}
                                {step === "success" && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="bg-green-50/90 backdrop-blur rounded-xl shadow-lg text-green-700 border border-green-200 overflow-hidden"
                                    >
                                        <div className="p-3 flex items-center gap-3">
                                            <CheckCircle className="shrink-0" />
                                            <div className="flex-1">
                                                <p className="font-bold">¡Ubicación Validada!</p>
                                                <p className="text-xs">Redirigiendo en {redirectCountdown} segundo{redirectCountdown !== 1 ? 's' : ''}...</p>
                                            </div>
                                        </div>
                                        {/* Barra de progreso */}
                                        <div className="w-full bg-green-200 h-1.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 3, ease: "linear" }}
                                                className="h-full bg-green-600"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                                {step === "denied" && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="bg-red-50/90 backdrop-blur p-3 rounded-xl shadow-lg flex items-center gap-3 text-red-700 border border-red-200"
                                    >
                                        <Lock className="shrink-0" />
                                        <div>
                                            <p className="font-bold">Acceso Denegado</p>
                                            <p className="text-xs">Estás fuera del perímetro permitido.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Area */}
                    <div className="p-6 bg-surface flex-none md:flex-1 flex flex-col justify-center">
                        {step === "intro" && (
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl">
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                        <Navigation size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-900">Validación de Perímetro</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Para mantener la seguridad de la comunidad, necesitamos verificar que te encuentras dentro de <b>{residential.name}</b>.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleStartVerification}
                                    className="w-full py-6 text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                                >
                                    Compartir Ubicación y Entrar
                                </Button>
                            </div>
                        )}

                        {step === "denied" && (
                            <div className="space-y-4 text-center">
                                {verificationStatus === 'found' ? (
                                    <div className="animate-in fade-in zoom-in duration-300 py-4">
                                        <p className="text-green-600 font-medium mb-2">¡Todo listo!</p>
                                        <p className="text-text-secondary text-sm">
                                            Te redireccionaremos al marketplace en <span className="font-bold text-primary">{Math.ceil(timeLeft / 1000) || 5}</span> segundos...
                                        </p>
                                        <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 5, ease: "linear" }}
                                                className="h-full bg-green-500"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {verificationStatus === 'idle' && (
                                            <>
                                                <p className="text-text-secondary text-sm">
                                                    Si crees que esto es un error, acércate más al centro del residencial o intenta validar mediante WhatsApp.
                                                </p>
                                                <Button
                                                    onClick={() => setStep("intro")}
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    Intentar de nuevo
                                                </Button>
                                                <div className="relative py-2">
                                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
                                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface px-2 text-text-secondary">O</span></div>
                                                </div>
                                            </>
                                        )}

                                        {verificationStatus !== 'searching' && (
                                            <Button
                                                onClick={handleWhatsappValidation}
                                                variant="secondary"
                                                disabled={verificationStatus === 'searching'}
                                                className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50"
                                            >
                                                <Smartphone className="mr-2" size={18} />
                                                Validar con WhatsApp
                                            </Button>
                                        )}

                                        {verificationStatus === 'searching' && (
                                            <div className="py-2 text-sm text-text-secondary animate-pulse">
                                                Conectando con el grupo del residencial...
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {step === "phone_input" && (
                            <div className="space-y-4">
                                <h4 className="font-bold text-lg text-center">Ingresa tu WhatsApp</h4>
                                <p className="text-text-secondary text-sm text-center">
                                    Para validarte, necesitamos verificar tu número de teléfono. Te enviaremos un código.
                                </p>
                                <div className="flex gap-2">
                                    <div className="relative max-w-[140px]">
                                        <select
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className="h-12 w-full appearance-none rounded-xl border border-border bg-surface pl-3 pr-8 text-lg focus:outline-none focus:ring-2 focus:ring-primary truncate"
                                        >
                                            {countries.map((c) => (
                                                <option key={`${c.code}-${c.name}`} value={c.code}>
                                                    {c.flag} {c.code}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                    <Input
                                        type="tel"
                                        placeholder="Número sin código"
                                        value={phone}
                                        onChange={(e) => {
                                            let val = e.target.value;

                                            // Check if user pasted a number with country code
                                            const matchedCountry = countries.find(c => val.startsWith(c.code));

                                            if (matchedCountry) {
                                                setCountryCode(matchedCountry.code);
                                                setPhone(val.replace(matchedCountry.code, ""));
                                            } else {
                                                setPhone(val);
                                            }
                                        }}
                                        className="text-lg flex-1"
                                    />
                                </div>
                                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                                <Button
                                    onClick={() => requestVerification(phone.startsWith("+") ? phone : `${countryCode}${phone}`)}
                                    disabled={!phone || isLoading}
                                    className="w-full"
                                >
                                    {isLoading && <Loader2 className="mr-2 animate-spin" />}
                                    Enviar Código
                                </Button>
                                <Button
                                    onClick={() => setStep("denied")}
                                    variant="ghost"
                                    className="w-full text-text-secondary"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        )}

                        {step === "otp_input" && (
                            <div className="space-y-4">
                                <h4 className="font-bold text-lg text-center">Ingresa el Código</h4>
                                <p className="text-text-secondary text-sm text-center">
                                    Hemos enviado un código de 6 dígitos a <b>{countryCode}{phone}</b>.
                                </p>
                                <div className="py-2">
                                    <OtpInput
                                        value={otp}
                                        onChange={setOtp}
                                        length={6}
                                    />
                                </div>
                                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                                <Button
                                    onClick={handleVerifyOtp}
                                    disabled={otp.length !== 6 || isLoading}
                                    className="w-full"
                                >
                                    {isLoading && <Loader2 className="mr-2 animate-spin" />}
                                    Verificar
                                </Button>
                                <div className="text-center pt-2">
                                    {timeLeft > 0 ? (
                                        <p className="text-xs text-text-secondary">
                                            Reenviar código en <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                                        </p>
                                    ) : (
                                        <button
                                            onClick={() => requestVerification(phone.startsWith("+") ? phone : `${countryCode}${phone}`)}
                                            className="text-xs text-primary hover:underline font-medium"
                                            disabled={isLoading}
                                        >
                                            No recibí el código, reenviar
                                        </button>
                                    )}
                                </div>
                                <Button
                                    onClick={() => setStep("phone_input")}
                                    variant="ghost"
                                    className="w-full text-text-secondary"
                                >
                                    Cambiar número
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

