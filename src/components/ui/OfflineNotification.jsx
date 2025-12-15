'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineNotification = () => {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Set initial state (safe for SSR/hydration)
        setIsOffline(!navigator.onLine);

        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-red-500 text-white fixed bottom-0 left-0 right-0 z-[100] overflow-hidden"
                >
                    <div className="flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium">
                        <WifiOff className="w-4 h-4" />
                        <span>Sin conexión a internet. Mostrando contenido guardado.</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
