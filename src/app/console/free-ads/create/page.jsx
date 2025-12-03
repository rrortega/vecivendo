"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import AdEditForm from "@/components/console/ads/AdEditForm";

export default function CreateAdPage() {
    const router = useRouter();

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg admin-hover admin-text-muted transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold admin-text">Nuevo Anuncio</h1>
                    <p className="admin-text-muted mt-1">Crea un nuevo anuncio gratuito</p>
                </div>
            </div>

            <AdEditForm />
        </div>
    );
}
