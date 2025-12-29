"use client";

import React, { useState, useEffect } from "react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { CommunityAlertBar } from "@/components/layout/CommunityAlertBar";
import { useResidential } from "@/hooks/useResidential";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ShoppingBag, Plus, X, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import AdAnalytics from "@/components/console/ads/AdAnalytics";
import { client, account, Databases } from "@/lib/appwrite";

export default function MisAnunciosPage({ params }) {
    const { residencial } = params;
    const router = useRouter();
    const { residential: residentialData } = useResidential(residencial);
    const { userProfile } = useUserProfile();
    const residentialName = residentialData?.nombre || residencial;

    const [anuncios, setAnuncios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const isVerifyingRef = React.useRef(false);
    const hasFetchedRef = React.useRef(false);

    useEffect(() => {
        // Verificar si el teléfono está verificado en localStorage
        const globalProfileData = localStorage.getItem('vecivendo_user_global');

        if (globalProfileData) {
            try {
                const userData = JSON.parse(globalProfileData);

                if (userData.telefono_verificado && userData.telefono && residentialData?.$id) {
                    // Solo verificar si no estamos ya verificando
                    if (!isVerifyingRef.current) {
                        verifyPhoneWithAPI(userData.telefono, residentialData.$id);
                    }
                } else {
                    // Si no está verificado en localStorage, marcar como no verificado
                    setPhoneVerified(!!userData.telefono_verificado);
                }
            } catch (error) {
                console.error('Error parsing vecivendo_user_global:', error);
                setPhoneVerified(false);
            }
        } else {
            setPhoneVerified(false);
        }
    }, [residentialData?.$id]); // Solo depender del ID del residencial

    const verifyPhoneWithAPI = async (phone, residentialId) => {
        isVerifyingRef.current = true; // Set ref to true when verification starts
        try {
            // Solicitar un nuevo token de sesión
            const tokenResponse = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone })
            });

            if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();

                // --- APPWRITE SESSION ---
                try {
                    console.log("🔐 Creando sesión de Appwrite...");
                    await account.createSession(tokenData.userId, tokenData.secret);
                    console.log("✅ Sesión de Appwrite iniciada correctamente");

                    // Actualizar el secret en localStorage
                    const globalProfileData = localStorage.getItem('vecivendo_user_global');
                    if (globalProfileData) {
                        const userData = JSON.parse(globalProfileData);
                        userData.appwriteSecret = tokenData.secret;
                        userData.userId = tokenData.userId;
                        localStorage.setItem('vecivendo_user_global', JSON.stringify(userData));
                    }
                } catch (appError) {
                    console.error("❌ Error al crear sesión de Appwrite:", appError);
                }

                setPhoneVerified(true);
            } else {
                console.error('Error obteniendo token de sesión');
                setPhoneVerified(false);
            }
        } catch (error) {
            console.error('Error verifying phone:', error);
            // En caso de error de red, confiar en localStorage
            setPhoneVerified(true);
        } finally {
            isVerifyingRef.current = false;
        }
    };

    useEffect(() => {
        // Solo hacer fetch una vez cuando phoneVerified cambia a true
        if (phoneVerified && userProfile?.telefono && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchAnuncios();
        } else if (!phoneVerified) {
            setIsLoading(false);
            hasFetchedRef.current = false; // Reset para permitir fetch cuando se verifique
        }
    }, [phoneVerified]); // Solo depender de phoneVerified


    const fetchAnuncios = async () => {
        setIsLoading(true);
        try {
            // Obtener teléfono del perfil global
            const globalProfileData = localStorage.getItem('vecivendo_user_global');
            let phone = userProfile?.telefono;

            if (globalProfileData) {
                try {
                    const userData = JSON.parse(globalProfileData);
                    phone = userData.telefono || phone;
                } catch (e) {
                    console.error('Error parsing vecivendo_user_global:', e);
                }
            }

            if (phone) {
                const response = await fetch(`/api/ads/user?phone=${encodeURIComponent(phone)}&residential=${encodeURIComponent(residencial)}`);

                if (!response.ok) {
                    throw new Error('Error fetching ads');
                }

                const data = await response.json();
                setAnuncios(data.documents || []);
            }
        } catch (error) {
            console.error("Error fetching anuncios:", error);
            setAnuncios([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleActive = async (anuncioId, currentStatus) => {
        try {
            const databases = new Databases(client);
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

            await databases.updateDocument(dbId, "anuncios", anuncioId, {
                activo: !currentStatus,
                last_capture: new Date().toISOString()
            });

            // Update local state
            setAnuncios(prev => prev.map(ad =>
                ad.$id === anuncioId ? { ...ad, activo: !currentStatus } : ad
            ));
        } catch (error) {
            console.error("Error toggling ad status:", error);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0 transition-all duration-300" style={{ paddingTop: 'var(--alert-bar-height, 0px)' }}>
            <CommunityAlertBar residentialSlug={residencial} />
            <HomeHeader
                residencialName={residentialName}
                residentialSlug={residencial}
                showFilters={false}
            />

            <div className="max-w-7xl mx-auto pt-10 md:pt-20 px-4 md:px-6">
                <div className="flex items-center gap-3 mb-8">
                    <ShoppingBag className="text-primary" size={32} />
                    <h1 className="text-3xl font-bold text-text-main">Mis Anuncios</h1>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-surface rounded-xl border border-border p-4 animate-pulse">
                                <div className="h-48 bg-border rounded-lg mb-3"></div>
                                <div className="h-5 bg-border rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-border rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : !phoneVerified ? (
                    <div className="bg-surface rounded-xl border border-border p-8 text-center">
                        <ShoppingBag className="mx-auto text-text-secondary/30 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-text-main mb-2">
                            Verifica tu número de teléfono
                        </h3>
                        <p className="text-text-secondary mb-6">
                            Para poder ver y gestionar tus anuncios, primero debes verificar tu número de teléfono en tu perfil.
                        </p>
                        <button
                            onClick={() => router.push(`/${residencial}/perfil`)}
                            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                        >
                            Ir a Mi Perfil
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Anuncios List */}
                        {anuncios.length > 0 && (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                                {anuncios.map((anuncio) => (
                                    <div
                                        key={anuncio.$id}
                                        className="bg-surface rounded-xl border border-border overflow-hidden hover:border-primary border-primary/50 shadow-lg transition-colors relative flex flex-col"
                                    >
                                        <div
                                            className="cursor-pointer flex-1"
                                            onClick={() => router.push(`/${residencial}/anuncio/${anuncio.$id}`)}
                                        >
                                            <div className="relative h-48 bg-gray-200">
                                                {anuncio.imagenes && anuncio.imagenes.length > 0 ? (
                                                    <img
                                                        src={anuncio.imagenes[0]}
                                                        alt={anuncio.titulo}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-text-secondary">
                                                        Sin imagen
                                                    </div>
                                                )}
                                                {!anuncio.activo && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                                            Desactivado
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 pb-0">
                                                <h3 className="font-semibold text-text-main mb-1 line-clamp-1">
                                                    {anuncio.titulo}
                                                </h3>
                                                <p className="text-sm text-text-secondary line-clamp-2">
                                                    {anuncio.descripcion}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 pt-3 flex items-center justify-end border-t border-border/50 mt-3">
                                            <button
                                                onClick={() => handleToggleActive(anuncio.$id, anuncio.activo)}
                                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors  ${anuncio.activo
                                                    ? "bg-green-100 text-green dark:bg-green-900/30 dark:text-green hover:bg-green-200"
                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 hover:bg-gray-200 "
                                                    }`}
                                            >
                                                {anuncio.activo ? "Activo" : "Inactivo"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Ad Box */}
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full border-2 border-dashed border-border hover:border-primary rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors group"
                        >
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Plus className="text-primary" size={32} />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-text-main mb-1">Agregar Nuevo Anuncio</p>
                                <p className="text-sm text-text-secondary">
                                    Publica en el grupo de tu residencial
                                </p>
                            </div>
                        </button>

                        {anuncios.length === 0 && !isLoading && (
                            <div className="text-center py-12 mb-6">
                                <ShoppingBag className="mx-auto text-text-secondary/30 mb-4" size={64} />
                                <p className="text-text-secondary text-lg mb-2">
                                    No tienes anuncios publicados
                                </p>
                                <p className="text-text-secondary/70 text-sm">
                                    Publica en el grupo de tu residencial para que aparezcan aquí
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-text-main">Cómo Publicar Anuncios</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-surface-hover rounded-full transition-colors"
                            >
                                <X size={20} className="text-text-secondary" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <p className="text-text-secondary">
                                Para crear anuncios, simplemente publícalos en el grupo de tu residencial.
                            </p>
                            <p className="text-text-secondary">
                                <strong className="text-text-main">VeciVendo hace el resto automáticamente.</strong>
                            </p>
                            <p className="text-text-secondary text-sm">
                                Puedes seguir una guía práctica para que tus anuncios lleguen a VeciVendo de manera más optimizada y mejor posicionada.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setShowModal(false);
                                router.push('/centro-de-ayuda?q=Publicar+anuncios+en+vecivendo');
                            }}
                            className="w-full bg-primary text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            <ExternalLink size={20} />
                            Ver Guía en Centro de Ayuda
                        </button>
                    </div>
                </div>
            )}


            <BottomNav />
        </div>
    );
}
