import React from "react";

export const BaseCard = ({ children, className = "", ...props }) => {
    return (
        <div
            className={`bg-surface rounded-2xl shadow-sm border border-border overflow-hidden ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
