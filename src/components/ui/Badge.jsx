import React from "react";

export const Badge = ({ children, variant = "default", className = "" }) => {
    const variants = {
        default: "bg-primary text-white",
        outline: "border border-border text-text-secondary",
        sale: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        success: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    };

    return (
        <span
            className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}
        >
            {children}
        </span>
    );
};
