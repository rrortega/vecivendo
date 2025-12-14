"use client";

import React from "react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { CategoryChips } from "@/components/home/CategoryChips";
import { ProductGrid } from "@/components/home/ProductGrid";
import { BottomNav } from "@/components/ui/BottomNav";
import { CategorySidebar } from "@/components/home/CategorySidebar";
import { CommunityAlertBar } from "@/components/layout/CommunityAlertBar";
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";
import { useResidential } from "@/hooks/useResidential";

export default function ResidentialHome({ params }) {
    const { residencial } = params;
    // We need the ID, but params only has slug. 
    // For now, we'll fetch the ID inside AlertBar using the slug or pass a prop if we had it.
    // Ideally, we should fetch residential details here or in a layout.
    // Let's assume we can pass the slug and handle it in the component or fetch it here.
    // Actually, the AlertBar expects ID. Let's modify AlertBar to accept slug or fetch by slug.
    // OR, since we seeded 'residencial-demo' as both slug and ID (or close to it), we might get away with it.
    // But better to be robust. Let's pass the slug and let the component handle it or fetch the ID.

    // Wait, in seed_alerts.js we used the ID.
    // Let's update CommunityAlertBar to find residential by slug first if needed, or just pass the slug if we change the query.
    // For simplicity, let's assume we need to fetch the residential first to get the ID.
    // But this is a server component (or client?). It's a default export, so it's a Server Component by default in Next.js 13+ unless 'use client'.
    // But we are using hooks in children.

    // Let's make this page a client component to fetch ID easily or just use the slug in the query if we index it.
    // The 'avisos_comunidad' has 'residencial_id'.
    // We need to find the residential ID from the slug 'residencial'.

    // Quick fix: Pass the slug to CommunityAlertBar and let it resolve the ID.

    const { residential: residentialData } = useResidential(residencial);
    const [sortOption, setSortOption] = React.useState("recent");
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [showBottomNav, setShowBottomNav] = React.useState(true);
    const lastScrollY = React.useRef(0);

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            setIsScrolled(currentScrollY > 50);

            // Determine scroll direction for Bottom Nav
            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                // Scrolling down - Hide
                setShowBottomNav(false);
            } else {
                // Scrolling up - Show
                setShowBottomNav(true);
            }

            lastScrollY.current = currentScrollY;
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const residentialName = residentialData?.nombre || residencial;
    const currency = residentialData?.moneda || "MXN";

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0 transition-all duration-300" style={{ paddingTop: 'var(--alert-bar-height, 0px)' }}>
            <CommunityAlertBar residentialSlug={residencial} />

            {/* Header - Scrolls with page on mobile, fixed on desktop */}
            <HomeHeader
                residencialName={residentialName}
                residentialSlug={residencial}
                sortOption={sortOption}
                onSortChange={setSortOption}
            />

            <div className="max-w-7xl mx-auto pt-4 md:pt-20 md:flex md:px-4 md:gap-6">
                {/* Sidebar for Desktop */}
                <CategorySidebar residentialId={residentialData?.$id} />

                <main className="flex-1 min-w-0">
                    {/* Banner ads are now handled inside ProductGrid */}

                    {/* Mobile Category Chips - Sticky on scroll */}
                    <div className="md:hidden">
                        <div className={`${isScrolled ? 'fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm pt-4 shadow-md animate-in slide-in-from-top duration-300' : ''}`}>
                            <CategoryChips residentialId={residentialData?.$id} />
                        </div>
                        {/* Placeholder to prevent layout jump when fixed */}
                        {isScrolled && <div className="h-[52px]" />}
                    </div>

                    <ProductGrid
                        currency={currency}
                        residentialSlug={residencial}
                        residentialId={residentialData?.$id}
                        sortOption={sortOption}
                    />
                </main>
            </div>

            {/* Bottom Nav - Always visible on mobile */}
            {/* Bottom Nav - Scroll aware on mobile */}
            <BottomNav
                className={`transition-transform duration-300 ${showBottomNav ? 'translate-y-0' : 'translate-y-full'}`}
            />
        </div>
    );
}
