"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, ExternalLink, Lock, Cookie, CheckCircle } from "lucide-react";

const SECURITY_MESSAGES = [
    { icon: Lock, text: "Cifrando sus datos de navegación..." },
    { icon: Shield, text: "Verificando que el sitio es seguro..." },
    { icon: Cookie, text: "Eliminando cookies para proteger su privacidad..." },
    { icon: CheckCircle, text: "¡Listo! Redirigiendo al sitio externo..." },
];

const REDIRECT_DURATION = 3000; // 3 seconds

/**
 * ExternalRedirectOverlay - Shows a security/privacy screen before redirecting to external links
 * @param {string} url - The external URL to redirect to
 * @param {function} onClose - Callback when overlay should close
 * @param {boolean} isOpen - Whether the overlay is visible
 */
export default function ExternalRedirectOverlay({ url, onClose, isOpen }) {
    const [progress, setProgress] = useState(0);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [hasRedirected, setHasRedirected] = useState(false);

    // Reset state when overlay opens
    useEffect(() => {
        if (isOpen) {
            setProgress(0);
            setCurrentMessageIndex(0);
            setHasRedirected(false);
        }
    }, [isOpen]);

    // Progress animation
    useEffect(() => {
        if (!isOpen || hasRedirected) return;

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / REDIRECT_DURATION) * 100, 100);
            setProgress(newProgress);

            // Update message based on progress
            const messageIndex = Math.min(
                Math.floor((newProgress / 100) * SECURITY_MESSAGES.length),
                SECURITY_MESSAGES.length - 1
            );
            setCurrentMessageIndex(messageIndex);

            // Complete - perform redirect
            if (newProgress >= 100) {
                clearInterval(interval);
                setHasRedirected(true);

                // Open in new tab
                window.open(url, '_blank', 'noopener,noreferrer');

                // Close overlay after a brief moment
                setTimeout(() => {
                    onClose?.();
                }, 500);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [isOpen, url, onClose, hasRedirected]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const CurrentIcon = SECURITY_MESSAGES[currentMessageIndex]?.icon || Shield;
    const currentMessage = SECURITY_MESSAGES[currentMessageIndex]?.text || "";

    // Extract domain from URL for display
    let displayDomain = url;
    try {
        const urlObj = new URL(url);
        displayDomain = urlObj.hostname;
    } catch {
        // Keep original if URL parsing fails
    }

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={(e) => {
                if (e.target === e.currentTarget && !hasRedirected) {
                    onClose?.();
                }
            }}
        >
            <div className="max-w-md w-full mx-4 bg-surface rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                        <ExternalLink size={32} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">
                        Saliendo de Vecivendo
                    </h2>
                    <p className="text-white/80 text-sm">
                        Serás redirigido a un sitio externo
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Destination URL */}
                    <div className="bg-gray-100 dark:bg-white/10 rounded-lg p-3 mb-6 text-center">
                        <p className="text-xs text-text-secondary mb-1">Destino:</p>
                        <p className="text-sm font-medium text-text-main truncate">
                            {displayDomain}
                        </p>
                    </div>

                    {/* Current security message */}
                    <div className="flex items-center gap-3 mb-6 min-h-[48px]">
                        <div className={`p-2 rounded-full transition-all duration-300 ${progress >= 100
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                : 'bg-primary/10 text-primary'
                            }`}>
                            <CurrentIcon size={20} className={progress < 100 ? 'animate-pulse' : ''} />
                        </div>
                        <p className="text-sm text-text-main flex-1 animate-in fade-in duration-200" key={currentMessageIndex}>
                            {currentMessage}
                        </p>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                        <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-100 ease-out rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-text-secondary text-center mt-2">
                            {Math.round(progress)}%
                        </p>
                    </div>

                    {/* Cancel button - only show if not yet redirected */}
                    {!hasRedirected && (
                        <button
                            onClick={() => onClose?.()}
                            className="w-full py-2 text-sm text-text-secondary hover:text-text-main transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                </div>

                {/* Footer notice */}
                <div className="bg-gray-50 dark:bg-white/5 px-6 py-3 border-t border-border">
                    <p className="text-xs text-text-secondary text-center">
                        <Shield size={12} className="inline-block mr-1 -mt-0.5" />
                        Vecivendo no es responsable del contenido de sitios externos
                    </p>
                </div>
            </div>
        </div>
    );
}
