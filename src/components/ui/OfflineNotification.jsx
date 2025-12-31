'use client';

import { WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnection } from '@/context/ConnectionContext';

export const OfflineNotification = () => {
    const { showOfflineMessage, dismissMessage } = useConnection();

    return (
        <AnimatePresence>
            {showOfflineMessage && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 z-[9999] overflow-hidden cursor-pointer"
                    onClick={dismissMessage}
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg hover:from-red-700 hover:to-red-600 transition-colors">
                        <div className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium relative">
                            <WifiOff className="w-5 h-5 animate-pulse" />
                            <span>Sin conexión a internet. Revisa tu conexión.</span>
                            <X className="w-4 h-4 absolute right-4 opacity-70" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
