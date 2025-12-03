"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
    theme: "system",
    setTheme: () => null,
});

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState("system");

    useEffect(() => {
        // Load saved theme from localStorage
        try {
            const savedTheme = localStorage.getItem("theme");
            if (savedTheme) {
                setTheme(savedTheme);
            }
        } catch (e) {
            console.warn("Failed to load theme from localStorage:", e);
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove previous classes
        root.classList.remove("light", "dark");

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
            console.log('Applying system theme:', systemTheme);
            root.classList.add(systemTheme);
            return;
        }

        console.log('Applying theme:', theme);
        root.classList.add(theme);

        // Save to localStorage
        try {
            localStorage.setItem("theme", theme);
        } catch (e) {
            console.warn("Failed to save theme to localStorage:", e);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => {
            if (prevTheme === "system") {
                const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                return isDark ? "light" : "dark";
            }
            return prevTheme === "dark" ? "light" : "dark";
        });
    };

    const value = {
        theme,
        setTheme,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
