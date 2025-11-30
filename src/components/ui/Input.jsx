import React from "react";

export const Input = ({ className = "", ...props }) => {
    return (
        <input
            className={`flex h-12 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        />
    );
};
