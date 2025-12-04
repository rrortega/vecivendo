"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Lock, Smartphone, X, Loader2, CheckCircle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

import { useTheme } from "@/context/ThemeContext";

// Dynamically import the Map component to avoid SSR issues
const LeafletMap = dynamic(() => import("./LeafletMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Cargando mapa...</div>
});

export const AccessModal = ({ isOpen, onClose, residential }) => {
    const { theme } = useTheme();
    const [step, setStep] = useState("intro"); // intro | verifying | success | denied
    const [userLocation, setUserLocation] = useState(null);
    const [error, setError] = useState(null);
    const router = useRouter();


    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
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
                            radius: maxRadius
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

                        setTimeout(() => {
                            router.push(`/${residential.slug}`);
                        }, 2000);
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
                        <LeafletMap
                            center={[resLat, resLng]}
                            zoom={14}
                            radius={maxRadius}
                            residentialName={residential.name}
                            userLocation={userLocation}
                        />

                        {/* Overlay Messages */}
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
                                    className="bg-green-50/90 backdrop-blur p-3 rounded-xl shadow-lg flex items-center gap-3 text-green-700 border border-green-200"
                                >
                                    <CheckCircle className="shrink-0" />
                                    <div>
                                        <p className="font-bold">¡Ubicación Validada!</p>
                                        <p className="text-xs">Redirigiendo al marketplace...</p>
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
                                <Button
                                    onClick={() => router.push("/profile")} // Fallback logic
                                    variant="secondary"
                                    className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50"
                                >
                                    <Smartphone className="mr-2" size={18} />
                                    Validar con WhatsApp
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

