'use client';

import { Download, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServiceWorker } from '@/hooks/useServiceWorker';

export const UpdatePrompt = () => {
    const { showUpdatePrompt, updateServiceWorker, dismissUpdatePrompt } = useServiceWorker();

    return (
        <AnimatePresence>
            {showUpdatePrompt && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-4 left-4 right-4 z-[9999] md:left-auto md:right-4 md:max-w-sm"
                >
                    <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl shadow-2xl overflow-hidden">
                        {/* Header decorativo */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500" />

                        <div className="p-4">
                            <div className="flex items-start gap-3">
                                {/* Ícono */}
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>

                                {/* Contenido */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base">
                                        ¡Nueva versión disponible!
                                    </h3>
                                    <p className="text-sm text-white/80 mt-0.5">
                                        Hay mejoras y correcciones listas para ti.
                                    </p>
                                </div>

                                {/* Botón cerrar */}
                                <button
                                    onClick={dismissUpdatePrompt}
                                    className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
                                    aria-label="Cerrar"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Botón de actualización */}
                            <button
                                onClick={updateServiceWorker}
                                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors shadow-lg"
                            >
                                <Download className="w-4 h-4" />
                                Actualizar ahora
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
