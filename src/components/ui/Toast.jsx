"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export const Toast = ({ message, type = "info", onClose, duration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle size={20} className="text-green-500" />,
        error: <AlertCircle size={20} className="text-red-500" />,
        info: <Info size={20} className="text-blue-500" />
    };

    const bgColors = {
        success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
        info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    };

    const textColors = {
        success: "text-green-800 dark:text-green-100",
        error: "text-red-800 dark:text-red-100",
        info: "text-blue-800 dark:text-blue-100"
    };

    return (
        <div
            className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 transform ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
                } ${bgColors[type] || bgColors.info} backdrop-blur-md`}
        >
            {icons[type] || icons.info}
            <p className={`text-sm font-medium ${textColors[type] || textColors.info}`}>{message}</p>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                }}
                className="p-1 border border-transparent hover:border-black/10 dark:hover:border-white/20 rounded-full transition-colors"
            >
                <X size={16} className="text-text-secondary" />
            </button>
        </div>
    );
};
