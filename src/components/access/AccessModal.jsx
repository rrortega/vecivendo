"use client";

import React, { useState } from "react";
import { MapPin, Lock, Smartphone, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export const AccessModal = ({ isOpen, onClose, residential }) => {
    const [step, setStep] = useState("geolocation"); // geolocation | whatsapp
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    if (!isOpen || !residential) return null;

    const handleGeolocationCheck = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("Tu navegador no soporta geolocalización.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // Residential coordinates (from prop or fallback to seeded values if prop missing)
                // In a real scenario, residential prop should have these values
                const resLat = residential.ubicacion_centro_lat || 21.08264694485578;
                const resLng = residential.ubicacion_centro_lng || -86.88846368188682;
                const maxRadius = residential.radio_autorizado_metros || 1609;

                // Haversine formula
                const R = 6371e3; // Earth radius in meters
                const φ1 = userLat * Math.PI / 180;
                const φ2 = resLat * Math.PI / 180;
                const Δφ = (resLat - userLat) * Math.PI / 180;
                const Δλ = (resLng - userLng) * Math.PI / 180;

                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;

                console.log(`Distance: ${distance.toFixed(2)}m, Max: ${maxRadius}m`);

                setTimeout(() => {
                    setLoading(false);
                    if (distance <= maxRadius) {
                        // Persist access
                        const grantedAccess = JSON.parse(localStorage.getItem("granted_access") || "[]");
                        if (!grantedAccess.includes(residential.slug)) {
                            localStorage.setItem("granted_access", JSON.stringify([...grantedAccess, residential.slug]));
                        }

                        router.push(`/${residential.slug}`);
                    } else {
                        setStep("whatsapp");
                    }
                }, 1500);
            },
            (err) => {
                console.error(err);
                setLoading(false);
                // If denied or error, go to fallback
                setStep("whatsapp");
            }
        );
    };

    const handleWhatsAppConnect = () => {
        // "Y si acepta esa opcion lo llevamos al perfil"
        router.push("/profile");
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="bg-primary/5 p-6 text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-text-secondary hover:text-text-main"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center mb-4">
                        <img
                            src={residential.image}
                            alt={residential.name}
                            className="w-full h-full object-cover rounded-2xl"
                        />
                    </div>
                    <h3 className="text-xl font-bold text-text-main">Acceder a {residential.name}</h3>
                    <p className="text-sm text-text-secondary mt-1">Verificación de seguridad</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === "geolocation" && (
                        <div className="text-center space-y-6">
                            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex items-start gap-3 text-left">
                                <MapPin className="shrink-0 mt-0.5" size={18} />
                                <p>Para acceder, necesitamos verificar que estás físicamente dentro del perímetro del residencial.</p>
                            </div>

                            <Button
                                onClick={handleGeolocationCheck}
                                className="w-full py-6 text-lg shadow-xl shadow-primary/20"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" />
                                        Verificando ubicación...
                                    </>
                                ) : (
                                    "Compartir Ubicación"
                                )}
                            </Button>
                        </div>
                    )}

                    {step === "whatsapp" && (
                        <div className="text-center space-y-6">
                            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm flex items-start gap-3 text-left">
                                <Lock className="shrink-0 mt-0.5" size={18} />
                                <p>No pudimos verificar tu ubicación. La otra forma de acceder es validando tu pertenencia al grupo de WhatsApp.</p>
                            </div>

                            <Button
                                onClick={handleWhatsAppConnect}
                                variant="secondary"
                                className="w-full py-6 text-lg border-2 border-green-500 text-green-600 hover:bg-surface hover:border-green-600"
                            >
                                <Smartphone className="mr-2" />
                                Conectar Cuenta
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
