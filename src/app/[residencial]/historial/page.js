"use client";

import React from "react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { BottomNav } from "@/components/ui/BottomNav";
import { CommunityAlertBar } from "@/components/layout/CommunityAlertBar";
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";
import { useResidential } from "@/hooks/useResidential";
import { Clock, Package } from "lucide-react";

export default function HistoryPage({ params }) {
    const { residencial } = params;
    const { residential: residentialData } = useResidential(residencial);
    const residentialName = residentialData?.nombre || residencial;

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0 transition-all duration-300" style={{ paddingTop: 'var(--alert-bar-height, 0px)' }}>
            <CommunityAlertBar residentialSlug={residencial} />
            <HomeHeader residencialName={residentialName} residentialSlug={residencial} />

            <div className="max-w-7xl mx-auto pt-20 md:pt-8 px-4 md:px-6">
                <div className="flex items-center gap-3 mb-8">
                    <Clock className="text-primary" size={32} />
                    <h1 className="text-3xl font-bold text-text-main">Historial de Pedidos</h1>
                </div>

                <div className="text-center py-20">
                    <Package className="mx-auto text-text-secondary/30 mb-4" size={64} />
                    <p className="text-text-secondary text-lg">
                        No tienes pedidos en {residentialName}
                    </p>
                    <p className="text-text-secondary/70 text-sm mt-2">
                        Tus pedidos realizados en este residencial aparecerán aquí
                    </p>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
