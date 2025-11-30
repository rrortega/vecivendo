import React from 'react';
import { Button } from "@/components/ui/Button";
import { User, MapPin, Phone } from "lucide-react";
import { useRouter } from 'next/navigation';

export function ProfileIncompleteModal({ isOpen, onClose, missingFields, residentialSlug }) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 border border-border">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-text-main mb-2">Perfil Incompleto</h3>
                    <p className="text-text-secondary text-sm">
                        Para realizar un pedido, necesitamos que completes tu información de contacto y ubicación.
                    </p>
                </div>

                <div className="bg-background rounded-xl p-4 mb-6 border border-border">
                    <h4 className="text-sm font-semibold text-text-main mb-3">Falta completar:</h4>
                    <ul className="space-y-2">
                        {missingFields.includes('nombre') && (
                            <li className="flex items-center gap-2 text-sm text-red-500">
                                <User size={16} /> <span>Nombre completo</span>
                            </li>
                        )}
                        {missingFields.includes('telefono') && (
                            <li className="flex items-center gap-2 text-sm text-red-500">
                                <Phone size={16} /> <span>Celular verificado</span>
                            </li>
                        )}
                        {(missingFields.includes('direccion') || missingFields.includes('ubicacion')) && (
                            <li className="flex items-center gap-2 text-sm text-red-500">
                                <MapPin size={16} /> <span>Dirección y ubicación en mapa</span>
                            </li>
                        )}
                    </ul>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => router.push(`/${residentialSlug || 'demo'}/perfil`)}
                        className="flex-1 bg-primary border-transparent hover:bg-primary hover:border-primary-dark text-white"
                    >
                        Ir al perfil ahora
                    </Button>
                </div>
            </div>
        </div>
    );
}
