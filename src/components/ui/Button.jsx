import React from "react";

export const Button = ({
    children,
    variant = "primary",
    size = "default",
    className = "",
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer border";

    const variants = {
        primary: "bg-primary text-white border-transparent hover:bg-primary hover:border-primary-dark shadow-lg shadow-primary/20",
        secondary: "bg-surface text-text-main border-border hover:bg-surface hover:border-primary",
        ghost: "bg-transparent border-transparent hover:bg-transparent text-text-secondary hover:text-text-main hover:border-primary",
        icon: "bg-surface text-text-main border-border hover:bg-surface hover:border-primary rounded-full",
    };

    const sizes = {
        default: "h-12 px-6 py-2 text-base",
        sm: "h-9 px-3 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
