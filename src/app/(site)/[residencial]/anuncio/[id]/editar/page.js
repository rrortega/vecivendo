"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomeHeader } from "@/components/home/HomeHeader";
import { CommunityAlertBar } from "@/components/layout/CommunityAlertBar";
import { useResidential } from "@/hooks/useResidential";
import AdEditForm from "@/components/console/ads/AdEditForm";
import { ChevronLeft } from "lucide-react";

function getPhoneVariations(phone) {
    if (!phone) return [];
    const cleanPhone = phone.replace(/\D/g, '');
    const variations = new Set();

    variations.add(phone);
    variations.add(cleanPhone);

    if (phone.startsWith('+52') || phone.startsWith('52')) {
        const withoutPrefix = cleanPhone.replace(/^52/, '');
        variations.add(`52${withoutPrefix}`);
        variations.add(`+52${withoutPrefix}`);
        variations.add(`521${withoutPrefix}`);
        variations.add(`+521${withoutPrefix}`);
    }

    return Array.from(variations);
}

export default function EditAdPage({ params }) {
    const { residencial, id } = params;
    const [ad, setAd] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const router = useRouter();
    const { residentialData, residentialName } = useResidential(residencial);

    useEffect(() => {
        fetchAd();
    }, [id]);

    const fetchAd = async () => {
        try {
            setLoading(true);

            // Verificar que el teléfono esté verificado
            const globalProfileData = localStorage.getItem('vecivendo_user_global');
            if (!globalProfileData) {
                router.push(`/${residencial}/mis-anuncios`);
                return;
            }

            const userData = JSON.parse(globalProfileData);
            const userPhone = userData.telefono;
            const isPhoneVerified = userData.telefono_verificado;

            // Si el teléfono no está verificado, redirigir
            if (!isPhoneVerified || !userPhone) {
                router.push(`/${residencial}/mis-anuncios`);
                return;
            }

            // Cargar el anuncio
            const response = await fetch(`/api/ads/${id}`);
            if (!response.ok) {
                throw new Error('Error al cargar el anuncio');
            }
            const data = await response.json();
            setAd(data);

            // Verificar que el usuario sea el propietario
            const phoneVariations = getPhoneVariations(userPhone);
            const ownerCheck = phoneVariations.includes(data.celular_anunciante);
            setIsOwner(ownerCheck);

            if (!ownerCheck) {
                router.push(`/${residencial}/mis-anuncios`);
            }
        } catch (error) {
            console.error("Error fetching ad:", error);
            router.push(`/${residencial}/mis-anuncios`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!ad || !isOwner) return null;

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0 transition-all duration-300" style={{ paddingTop: 'var(--alert-bar-height, 0px)' }}>
            <CommunityAlertBar residentialSlug={residencial} />
            <HomeHeader
                residencialName={residentialName}
                residentialSlug={residencial}
                showFilters={false}
            />

            <div className="max-w-7xl mx-auto pt-8 md:pt-20 px-4 md:px-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push(`/${residencial}/mis-anuncios`)}
                        className="p-2 rounded-lg hover:bg-surface transition-colors"
                    >
                        <ChevronLeft size={24} className="text-text-main" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">Editar Anuncio</h1>
                        <p className="text-text-secondary mt-1">{ad.titulo}</p>
                    </div>
                </div>

                {/* Edit Form */}
                <AdEditForm
                    ad={ad}
                    hideAdvertiserFields={true}
                    onDeleteSuccess={() => router.push(`/${residencial}/mis-anuncios`)}
                    onSaveSuccess={() => router.push(`/${residencial}/mis-anuncios`)}
                />
            </div>
        </div>
    );
}
