"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomNav } from "@/components/ui/BottomNav";
import { Databases, Query, Storage, ID } from "appwrite";
import { User, Settings, Bell, MapPin, LogOut, Check, Camera, Loader2, ArrowLeft, Moon, Sun, Send, Save, Menu, X, Package, Heart, FileText, Shield, HelpCircle, ShoppingBag, Info, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTheme } from "@/context/ThemeContext";
import dynamic from 'next/dynamic';
import { client } from "@/lib/appwrite";

const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-48 bg-surface rounded-xl border border-border animate-pulse" />
});

export default function ProfilePage({ params }) {
    const router = useRouter();
    const { residencial } = params;
    const [residentialName, setResidentialName] = React.useState(residencial);
    const [residentialData, setResidentialData] = React.useState(null);
    const { userProfile, updateUserProfile, saveUserProfile, isDirty } = useUserProfile(residencial);
    const { theme, toggleTheme } = useTheme();

    // Track which section has changes
    const [hasGlobalChanges, setHasGlobalChanges] = React.useState(false);
    const [hasResidentialChanges, setHasResidentialChanges] = React.useState(false);

    // Verification State
    const [isVerifying, setIsVerifying] = React.useState(false);
    const [showOtpModal, setShowOtpModal] = React.useState(false);
    const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
    const [verificationError, setVerificationError] = React.useState('');
    const [residencialId, setResidencialId] = React.useState(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const searchParams = useSearchParams();

    // Handle auto-update location from prompt
    React.useEffect(() => {
        const shouldUpdate = searchParams.get('auto_update_location');
        const newLat = searchParams.get('lat');
        const newLng = searchParams.get('lng');

        if (shouldUpdate === 'true' && newLat && newLng) {
            console.log("Auto-updating location from params:", newLat, newLng);
            updateUserProfile({
                lat: parseFloat(newLat),
                lng: parseFloat(newLng)
            });
            // Clean up params
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams, updateUserProfile]);

    React.useEffect(() => {
        const fetchResidentialDetails = async () => {
            if (!residencial) return;
            console.log("Fetching details for slug:", residencial);
            try {
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
                const response = await databases.listDocuments(
                    dbId,
                    "residenciales",
                    [Query.equal("slug", residencial)]
                );
                if (response.documents.length > 0) {
                    const doc = response.documents[0];
                    setResidentialName(doc.nombre || residencial);
                    setResidencialId(doc.$id);
                    console.log("Fetched Residential Doc:", doc);

                    const centerLat = doc.ubicacion_centro_lat || doc.latitud;
                    const centerLng = doc.ubicacion_centro_lng || doc.longitud;
                    const radius = doc.radio_autorizado_metros || doc.radio;

                    setResidentialData({
                        center: centerLat && centerLng ? { lat: parseFloat(centerLat), lng: parseFloat(centerLng) } : null,
                        radius: parseFloat(radius) || 1000,
                        country: doc.country || 'MX',
                        phone_prefix: doc.phone_prefix || '52',
                        portada: doc.portada || null
                    });
                } else if (residencial === 'demo') {
                    // Fallback for demo if not in DB
                    console.log("Using fallback demo data");
                    setResidentialName("Residencial Demo");
                    setResidentialData({
                        center: { lat: 21.1619, lng: -86.8515 }, // Cancun center
                        radius: 500,
                        country: 'MX',
                        phone_prefix: '52',
                        portada: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80"
                    });
                }
            } catch (error) {
                console.error("Error fetching residential details:", error);
            }
        };
        fetchResidentialDetails();
    }, [residencial]);

    // Check for verified phone in localStorage
    React.useEffect(() => {
        // Only run if profile phone is empty to avoid overwriting user edits
        if (!userProfile.telefono) {
            const verifiedPhone = localStorage.getItem("user_phone_verified");
            if (verifiedPhone) {
                // If stored verified phone exists, use it.
                // Assuming stored phone might contain country code (e.g. +521234567890)
                // We should probably strip it if the UI expects just the number, 
                // OR adapt the UI. The current UI logic (handleSendCode) prepends prefix.
                // Let's try to strip standard prefixes if they match residential data
                // For simplicity, just set it. The user can correct it if needed, 
                // but since we verified it, it should be correct.

                // Better approach: Check if it starts with the prefix of the residential
                // residentialData might not be loaded yet inside this effect if it depends on async fetch.
                // But we can just set it and let the user see.

                // Let's strip the '+' if present for display consistency if the input is number only
                // The input has .replace(/\D/g, '') on change, so it expects numbers.
                let cleanPhone = verifiedPhone.replace(/^\+/, '');

                // If we know the prefix (e.g. 52), we could try to strip it if checking against residentialData
                // But residentialData is async. 
                // Let's just put the numbers. If it includes country code, it's safer than missing it.

                updateUserProfile({
                    telefono: cleanPhone,
                    telefono_verificado: true
                });
            }
        } else if (userProfile.telefono && !userProfile.telefono_verificado) {
            // If user has a phone but not verified, checks if matches locally verified one
            const verifiedPhone = localStorage.getItem("user_phone_verified");
            if (verifiedPhone) {
                const cleanVerified = verifiedPhone.replace(/\D/g, '');
                const cleanCurrent = userProfile.telefono.replace(/\D/g, '');
                // Loose check: if current phone is contained in verified phone (to handle prefixes) or vice versa
                if (cleanVerified.endsWith(cleanCurrent) && cleanCurrent.length > 7) {
                    updateUserProfile({ telefono_verificado: true });
                }
            }
        }
    }, [userProfile.telefono, updateUserProfile]);

    // Wrapper function to track which section has changes
    const handleUpdateProfile = (updates) => {
        const globalFields = ['nombre', 'telefono', 'telefono_verificado', 'userId', 'photo'];
        const residentialFields = ['calle', 'manzana', 'lote', 'casa', 'ubicacion', 'lat', 'lng'];

        const hasGlobal = Object.keys(updates).some(key => globalFields.includes(key));
        const hasResidential = Object.keys(updates).some(key => residentialFields.includes(key));

        if (hasGlobal) setHasGlobalChanges(true);
        if (hasResidential) setHasResidentialChanges(true);

        updateUserProfile(updates);
    };

    // Custom save function that resets flags
    const handleSaveProfile = () => {
        saveUserProfile();
        setHasGlobalChanges(false);
        setHasResidentialChanges(false);
    };

    const handleSendCode = async () => {
        if (!userProfile.telefono) return;

        // Validate Name
        if (!userProfile.nombre || userProfile.nombre.trim() === '') {
            setVerificationError('Debes ingresar tu Nombre y Apellidos antes de verificar.');
            return;
        }

        setIsVerifying(true);
        setVerificationError('');

        try {
            // If phone already has country code, use it; otherwise add prefix
            const phoneNumber = userProfile.telefono.replace(/\D/g, '');
            const fullPhone = phoneNumber.length > 10 ? phoneNumber : `${residentialData?.phone_prefix || '52'}${phoneNumber}`;
            const response = await fetch('/api/verify-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: fullPhone,
                    residential_id: residencialId,
                    action: 'code',
                    name: userProfile.nombre,
                    address: {
                        calle: userProfile.calle,
                        manzana: userProfile.manzana,
                        lote: userProfile.lote,
                        casa: userProfile.casa
                    },
                    location: {
                        lat: userProfile.lat,
                        lng: userProfile.lng
                    }
                })
            });

            const data = await response.json();

            if (response.ok) {
                setShowOtpModal(true);
            } else {
                setVerificationError(data.error || 'Error al enviar el código');
            }
        } catch (error) {
            setVerificationError('Error de conexión');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleVerifyCode = async () => {
        const code = otp.join('');
        if (code.length !== 6) return;

        setIsVerifying(true);
        setVerificationError('');

        try {
            // If phone already has country code, use it; otherwise add prefix
            const phoneNumber = userProfile.telefono.replace(/\D/g, '');
            const fullPhone = phoneNumber.length > 10 ? phoneNumber : `${residentialData?.phone_prefix || '52'}${phoneNumber}`;
            const response = await fetch('/api/verify-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: fullPhone,
                    residential_id: residencialId,
                    action: 'verify',
                    code: code
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Save userId from response and full phone with country code
                const updates = {
                    telefono: fullPhone, // Save with country code
                    telefono_verificado: true,
                    userId: data.userId // Assuming the API returns userId
                };
                updateUserProfile(updates);

                // Force save
                saveUserProfile();

                setShowOtpModal(false);
                setOtp(['', '', '', '', '', '']);
            } else {
                setVerificationError(data.error || 'Código incorrecto');
            }
        } catch (error) {
            setVerificationError('Error de conexión');
        } finally {
            setIsVerifying(false);
        }
    };

    const handlePhotoClick = () => {
        if (userProfile.telefono_verificado && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const storage = new Storage(client);
            const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "profiles"; // Fallback or env var

            // Upload file
            const response = await storage.createFile(
                bucketId,
                ID.unique(),
                file
            );

            // Get View URL
            const photoUrl = storage.getFileView(bucketId, response.$id);

            updateUserProfile({ photo: photoUrl.href });
            // We might also want to update the Auth user prefs if we had a session, 
            // but for now we just update the local profile as requested.

        } catch (error) {
            console.error("Error uploading photo:", error);
            // Handle error (maybe show a toast)
        } finally {
            setIsUploading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };



    const menuItems = [
        { icon: User, label: "Mis Datos", href: `/${residencial}/perfil`, active: true },
        { icon: ShoppingBag, label: "Mis Pedidos", href: `/${residencial}/historial` },
        { icon: Heart, label: "Mis Favoritos", href: `/${residencial}/favoritos` },
        { icon: Megaphone, label: "Mis Anuncios", href: `/${residencial}/mis-anuncios` },
        { icon: FileText, label: "Términos y Condiciones", href: "/legal/terminos-y-condiciones" },
        { icon: Shield, label: "Política de Privacidad", href: "/legal/politica-de-privacidad" },
        { icon: Info, label: "Quiénes Somos", href: "/legal/sobre-nosotros" },
        { icon: HelpCircle, label: "Centro de Ayuda", href: "/centro-de-ayuda" },
    ];

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0 transition-all duration-300">
            {/* Custom Header with Back Button */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border shadow-sm h-16 flex items-center px-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-text-secondary hover:text-primary transition-colors rounded-full border border-transparent hover:border-primary"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="ml-2 text-lg font-bold text-text-main">Mi Perfil</h1>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="ml-auto lg:hidden p-2 text-text-secondary hover:text-primary transition-colors rounded-full border border-transparent hover:border-primary"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="fixed top-16 right-0 bottom-0 z-[70] w-80 bg-surface border-l border-border shadow-xl lg:hidden overflow-y-auto">
                        <nav className="p-4 space-y-2">
                            {menuItems.map((item) => {
                                const requiresVerification = item.label === "Mis Pedidos" || item.label === "Mis Anuncios";
                                const isDisabled = requiresVerification && !userProfile?.telefono_verificado;

                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => {
                                            if (isDisabled) {
                                                alert("Debes verificar tu teléfono antes de acceder a esta sección");
                                                return;
                                            }
                                            router.push(item.href);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${item.active
                                            ? "bg-primary/10 text-primary border border-primary"
                                            : isDisabled
                                                ? "text-text-secondary/50 cursor-not-allowed border border-transparent"
                                                : "text-text-secondary hover:bg-surface-hover hover:text-text-main border border-transparent hover:border-border"
                                            }`}
                                        disabled={isDisabled}
                                    >
                                        <item.icon size={20} />
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </>
            )}

            {/* Desktop/Tablet Sidebar */}
            <aside className="hidden lg:block fixed right-8 top-24 lg:w-16 xl:w-72 bg-surface rounded-2xl border border-border shadow-lg lg:p-2 xl:p-4 z-40">
                <nav className="space-y-2">
                    {menuItems.map((item) => {
                        const requiresVerification = item.label === "Mis Pedidos" || item.label === "Mis Anuncios";
                        const isDisabled = requiresVerification && !userProfile?.telefono_verificado;

                        return (
                            <button
                                key={item.label}
                                onClick={() => {
                                    if (isDisabled) {
                                        alert("Debes verificar tu teléfono antes de acceder a esta sección");
                                        return;
                                    }
                                    router.push(item.href);
                                }}
                                className={`w-full flex items-center lg:justify-center xl:justify-start gap-3 lg:px-2 xl:px-4 py-3 rounded-lg transition-colors group ${item.active
                                    ? "bg-primary/10 text-primary border border-primary"
                                    : isDisabled
                                        ? "text-text-secondary/50 cursor-not-allowed border border-transparent"
                                        : "text-text-secondary hover:bg-surface-hover hover:text-text-main border border-transparent hover:border-border"
                                    }`}
                                title={item.label}
                                disabled={isDisabled}
                            >
                                <item.icon size={20} className="shrink-0" />
                                <span className="font-medium hidden xl:block">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            <div className="max-w-2xl mx-auto pt-10 md:pt-20 px-4 md:px-6">
                {/* Residential Cover */}
                {residentialData?.portada && (
                    <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-6 shadow-sm border border-border relative group">
                        <img
                            src={residentialData.portada}
                            alt={`Portada ${residentialName}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h2 className="text-2xl md:text-3xl font-bold drop-shadow-md">{residentialName}</h2>
                            {residentialData.city && (
                                <p className="text-white/90 text-sm flex items-center gap-1 mt-1">
                                    <MapPin size={14} />
                                    {residentialData.city}
                                </p>
                            )}
                        </div>
                    </div>
                )}
                {/* Profile Header */}
                <div className="bg-surface rounded-2xl p-6 mb-6 border border-border">
                    <div className="flex items-center gap-4">
                        <div
                            className={`w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden relative group ${userProfile.telefono_verificado ? 'cursor-pointer hover:opacity-80' : ''}`}
                            onClick={handlePhotoClick}
                        >
                            {userProfile.photo ? (
                                <img src={userProfile.photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <img
                                    src={`https://api.dicebear.com/9.x/shapes/svg?seed=${userProfile.telefono || 'default'}`}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            )}

                            {userProfile.telefono_verificado && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white" size={24} />
                                </div>
                            )}

                            {isUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-text-main">{userProfile.nombre || 'Mi Perfil'}</h1>
                            <p className="text-text-secondary flex items-center gap-1 mt-1 text-sm">
                                <MapPin size={14} className="shrink-0" />
                                <span className="line-clamp-1">
                                    {[
                                        residentialName,
                                        userProfile.calle,
                                        userProfile.manzana ? `Mz ${userProfile.manzana}` : '',
                                        userProfile.lote ? `Lt ${userProfile.lote}` : '',
                                        userProfile.casa ? `#${userProfile.casa}` : ''
                                    ].filter(Boolean).join(', ')}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Datos Personales Section */}
                <div className="bg-surface rounded-2xl p-6 mb-6 border border-gray-200 relative">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-text-main">Mis Datos Personales</h2>
                        {hasGlobalChanges && isDirty && (
                            <button
                                onClick={handleSaveProfile}
                                className="bg-primary text-white p-2 rounded-lg shadow-lg transition-all duration-200 animate-in fade-in zoom-in border border-transparent hover:border-white"
                                title="Guardar cambios"
                            >
                                <Save size={20} />
                            </button>
                        )}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Nombre Completo</label>
                            <input
                                type="text"
                                value={userProfile.nombre}
                                onChange={(e) => handleUpdateProfile({ nombre: e.target.value })}
                                className="w-full bg-surface border border-gray-300 rounded-lg px-3 py-2 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-11"
                                placeholder="Tu nombre completo"
                            />
                        </div>
                    </div>

                    {/* Phone Input */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Celular</label>
                        <div className="flex gap-2 items-start">
                            <div className="flex items-center gap-2 bg-surface border border-gray-300 rounded-lg px-3 py-2 text-text-secondary select-none shrink-0">
                                {residentialData?.country ? (
                                    <img
                                        src={`https://flagcdn.com/${residentialData.country.toLowerCase()}.svg`}
                                        alt={residentialData.country}
                                        className="w-6 h-auto object-cover rounded-sm"
                                    />
                                ) : (
                                    <span>🏳️</span>
                                )}
                                <span>+{residentialData?.phone_prefix || '52'}</span>
                            </div>
                            {userProfile.telefono_verificado ? (
                                <div className="flex items-center w-full bg-green-50/50 border border-green-200 rounded-lg px-3 py-2 text-text-main h-11 animate-in fade-in">
                                    <Check className="text-green-500 mr-2" size={18} />
                                    <span className="text-text-main font-medium select-all flex-1">{userProfile.telefono?.replace(/^(\+?52|\+?1)/, '') || userProfile.telefono}</span>
                                    <span className="text-[10px] uppercase tracking-wider text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200 font-bold ml-2">Verificado</span>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row flex-1 min-w-0 gap-2 md:gap-0">
                                    <input
                                        type="tel"
                                        value={userProfile.telefono?.replace(/^(\+?52|\+?1)/, '') || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            handleUpdateProfile({ telefono: val, telefono_verificado: false });
                                        }}
                                        className={`flex-1 bg-surface border border-gray-300 rounded-lg px-3 py-2 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${(userProfile.telefono?.replace(/^(\+?52|\+?1)/, '') || '').length >= 9 ? 'rounded-r-lg  ' : ''} min-w-0`}
                                        placeholder="Número celular"
                                    />
                                    {(userProfile.telefono?.replace(/^(\+?52|\+?1)/, '') || '').length >= 9 && (
                                        <Button
                                            variant="outline"
                                            onClick={handleSendCode}
                                            disabled={!userProfile.telefono || isVerifying}
                                            className="w-full md:w-12 flex items-center justify-center transition-colors border border-primary/30 rounded-lg md:rounded-lg ml-2 bg-surface hover:border-primary min-w-[70px] max-h-[42px]  py-0"
                                            title="Verificar número"
                                        >
                                            {isVerifying ? (
                                                <Loader2 className="animate-spin text-primary" size={20} />
                                            ) : (
                                                <>
                                                    <Check className="text-primary" size={20} />
                                                    <span className="md:hidden ml-2 font-medium text-primary">Validar celular</span>
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {userProfile.telefono_verificado && (
                            <p className="text-green-600 text-xs mt-1">
                                Este celular ya está verificado en el residencial
                            </p>
                        )}

                        {verificationError && !showOtpModal && (
                            <p className="text-red-500 text-xs mt-1 text-right">{verificationError}</p>
                        )}
                    </div>
                </div>

                {/* Dirección en Residencial Section */}
                <div className="bg-surface rounded-2xl p-6 mb-6 border border-gray-200 relative">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-text-main">Mi Dirección en {residentialName}</h2>
                        {hasResidentialChanges && isDirty && (
                            <button
                                onClick={handleSaveProfile}
                                className="bg-primary text-white p-2 rounded-lg shadow-lg transition-all duration-200 animate-in fade-in zoom-in border border-transparent hover:border-white"
                                title="Guardar cambios"
                            >
                                <Save size={20} />
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="block mt-3 text-sm font-medium text-text-secondary mb-1">Calle</label>
                        <input
                            type="text"
                            value={userProfile.calle}
                            onChange={(e) => handleUpdateProfile({ calle: e.target.value })}
                            className="w-full bg-surface border border-gray-300 rounded-lg px-3 py-2 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-11 mb-2"
                            placeholder="Ej. Av. Principal"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Manzana</label>
                            <input
                                type="text"
                                value={userProfile.manzana}
                                onChange={(e) => handleUpdateProfile({ manzana: e.target.value })}
                                className="w-full bg-surface border border-gray-300 rounded-lg px-3 py-2 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-11 mb-2"
                                placeholder="Ej. A"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Lote</label>
                            <input
                                type="text"
                                value={userProfile.lote}
                                onChange={(e) => handleUpdateProfile({ lote: e.target.value })}
                                className="w-full bg-surface border border-gray-300 rounded-lg px-3 py-2 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-11 mb-2"
                                placeholder="Ej. 12"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Casa/Depto</label>
                            <input
                                type="text"
                                value={userProfile.casa}
                                onChange={(e) => handleUpdateProfile({ casa: e.target.value })}
                                className="w-full bg-surface border border-gray-300 rounded-lg px-3 py-2 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-11 mb-2"
                                placeholder="Ej. 4B"
                            />
                        </div>
                    </div>
                    {!isMobileMenuOpen && (
                        <div>
                            <LocationPicker
                                initialLat={userProfile.lat}
                                initialLng={userProfile.lng}
                                onLocationSelect={(lat, lng) => handleUpdateProfile({ lat, lng })}
                                residentialName={residentialName}
                                residentialCenter={residentialData?.center}
                                residentialRadius={residentialData?.radius}
                            />
                        </div>
                    )}

                    {userProfile.lat && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                            <label className="block text-sm font-medium text-text-secondary mb-1">Descripción de Ubicación</label>
                            <textarea
                                value={userProfile.ubicacion}
                                onChange={(e) => handleUpdateProfile({ ubicacion: e.target.value })}
                                className="w-full bg-surface border border-gray-300 rounded-lg px-3 py-2 text-text-main focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none h-20 resize-none mb-2"
                                placeholder="Ej. Casa blanca con portón negro..."
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Theme Toggle */}
            <div className="max-w-2xl mx-auto px-4 md:px-6 mb-20">
                <div className="bg-surface rounded-2xl p-6 border border-gray-200">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 text-left"
                    >
                        {theme === 'dark' ? (
                            <Moon className="text-primary" size={24} />
                        ) : (
                            <Sun className="text-primary" size={24} />
                        )}
                        <div className="flex-1">
                            <p className="font-bold text-text-main text-lg">Modo Oscuro</p>
                            <p className="text-sm text-text-secondary">
                                {theme === 'dark' ? 'Activado' : 'Desactivado'}
                            </p>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </button>
                </div>
            </div>


            {/* OTP Modal */}
            {
                showOtpModal && (
                    <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold text-text-main mb-2 text-center">Código de Verificación</h3>
                            <p className="text-text-secondary text-sm text-center mb-6">
                                Ingresa el código de 6 dígitos enviado a tu celular.
                            </p>

                            <div className="flex justify-center gap-2 mb-6">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-10 h-12 text-center text-xl font-bold bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                    />
                                ))}
                            </div>

                            {verificationError && (
                                <p className="text-red-500 text-sm text-center mb-4">{verificationError}</p>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowOtpModal(false);
                                        setVerificationError('');
                                    }}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleVerifyCode}
                                    disabled={otp.some(d => !d) || isVerifying}
                                    className="flex-1"
                                >
                                    {isVerifying ? 'Validando...' : 'Validar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            <BottomNav />
        </div >
    );
}
