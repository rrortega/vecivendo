"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/console/Sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

const ConsoleLayoutContent = ({ children }) => {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            <div className="min-h-screen flex items-center justify-center admin-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    // If on login page, render without sidebar
    if (pathname === "/console/login") {
        return <div className="min-h-screen admin-bg">{children}</div>;
    }

    // If authenticated and admin, render with sidebar
    if (user && isAdmin()) {
        return (
            <div className="flex min-h-screen admin-bg admin-panel">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 flex flex-col h-screen overflow-hidden">
                    {/* Mobile Header */}
                    <div className="md:hidden admin-surface border-b admin-border p-4 flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="admin-text-muted hover:admin-text"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="font-semibold admin-text">Console</span>
                    </div>

                    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                        {children}
                    </div>
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
