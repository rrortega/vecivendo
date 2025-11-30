"use client";

import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmación",
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "primary" // primary, destructive
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-yellow-600">
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className="text-xl font-bold text-text-main mb-2">{title}</h3>
                    <p className="text-text-secondary mb-6 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={variant === "destructive" ? "destructive" : "default"}
                            className={`flex-1 ${variant === "destructive" ? "bg-red-500 hover:bg-red-500 border-transparent hover:border-red-600 text-white" : ""}`}
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
