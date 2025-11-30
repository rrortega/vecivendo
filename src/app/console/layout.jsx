"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/console/Sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const ConsoleLayoutContent = ({ children }) => {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                if (pathname !== "/console/login") {
                    router.push("/console/login");
                }
            } else if (!isAdmin()) {
                // If logged in but not admin, maybe redirect to home or show error
                // For now, let's redirect to home
                router.push("/");
            } else if (pathname === "/console/login") {
                // If logged in and admin, and trying to access login, redirect to dashboard
                router.push("/console");
            }
        }
    }, [user, loading, isAdmin, router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    // If on login page, render without sidebar
    if (pathname === "/console/login") {
        return <div className="min-h-screen bg-gray-100 dark:bg-gray-900">{children}</div>;
    }

    // If authenticated and admin, render with sidebar
    if (user && isAdmin()) {
        return (
            <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
                <Sidebar />
                <main className="flex-1 p-8 overflow-y-auto h-screen">
                    {children}
                </main>
            </div>
        );
    }

    return null; // Should have redirected by now
};

export default function ConsoleLayout({ children }) {
    return (
        <AuthProvider>
            <ConsoleLayoutContent>{children}</ConsoleLayoutContent>
        </AuthProvider>
    );
}
