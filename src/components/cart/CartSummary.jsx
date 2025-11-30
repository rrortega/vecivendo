import React from "react";
import { Button } from "@/components/ui/Button";

export const CartSummary = ({ subtotal, deliveryFee, discount, total, onCheckout }) => {
    const formatPrice = (amount) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <div className="bg-surface rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-border p-6 pb-safe mt-auto">
            <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-text-secondary">
                    <span>Subtotal:</span>
                    <span className="font-medium text-text-main">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-secondary">
                    <span>Envío:</span>
                    <span className="font-medium text-text-main">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-secondary">
                    <span>Descuento:</span>
                    <span className="font-medium text-text-main">-${discount.toFixed(2)}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-text-main">Total:</span>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-text-main block">
                            {formatPrice(total)} MXN
                        </span>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-4 p-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    <p>
                        El pedido se enviará directamente al anunciante por WhatsApp, pero dejará un registro en VeciVendo para que puedas luego dejar un review del servicio y sirva de reputación para el anunciante.
                    </p>
                    <p className="mt-2">
                        VeciVendo no cobra comisión por conectar oferta y demanda, es totalmente gratis. Pero si te genera valor y quieres ayudar a mantenerlo puedes donar lo que te costaría un café para que sigamos mejorando la plataforma.
                    </p>
                </div>
            </div>

            <Button
                className="w-full rounded-2xl bg-[#25D366] hover:bg-[#25D366] border-transparent hover:border-[#20bd5a] text-white shadow-lg shadow-green-200/50 dark:shadow-none flex items-center justify-center gap-2"
                size="lg"
                onClick={onCheckout}
            >
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                Iniciar pedido • {formatPrice(total)}
            </Button>
        </div>
    );
};
