"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Haversine formula to calculate distance in meters
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius of the earth in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

export default function LocationUpdatePrompt({ params }) {
    const router = useRouter();
    const pathname = usePathname();
    const [showPrompt, setShowPrompt] = useState(false);
    const [newLocation, setNewLocation] = useState(null);

    useEffect(() => {
        // Don't show on profile page to avoid loops or annoyance while editing
        if (pathname.includes('/perfil')) return;

        const checkLocationDiff = () => {
            try {
                // 1. Check suppression
                const suppression = localStorage.getItem('suppress_location_update');
                if (suppression) {
                    const suppressionTime = parseInt(suppression, 10);
                    const now = new Date().getTime();
                    // 24 hours = 24 * 60 * 60 * 1000 = 86400000 ms
                    if (now - suppressionTime < 86400000) {
                        return;
                    }
                }

                // 2. Get User Profile Location (Home)
                const profileStr = localStorage.getItem('vecivendo_user_profile');
                if (!profileStr) return;
                const profile = JSON.parse(profileStr);

                if (!profile.lat || !profile.lng) return; // No home location set

                // 3. Get Latest User Location (from AccessModal)
                const latestLocStr = localStorage.getItem('latest_user_location');
                if (!latestLocStr) return;
                const latestLoc = JSON.parse(latestLocStr);

                // Check if latest location is fresh (e.g., within last 5 minutes)
                // If it's too old, we shouldn't prompt based on stale data
                const now = new Date().getTime();
                if (now - latestLoc.timestamp > 5 * 60 * 1000) return;

                // 4. Calculate Distance
                const distance = getDistanceFromLatLonInMeters(
                    profile.lat,
                    profile.lng,
                    latestLoc.lat,
                    latestLoc.lng
                );

                console.log(`Distance between home and current: ${distance.toFixed(2)}m`);

                if (distance > 50) {
                    setNewLocation(latestLoc);
                    setShowPrompt(true);
                }

            } catch (error) {
                console.error("Error checking location difference:", error);
            }
        };

        // Run check on mount
        checkLocationDiff();

    }, [pathname]);

    const handleYes = () => {
        if (!newLocation) return;
        // Redirect to profile with params
        // Assuming params.residencial is available or we can extract it
        // The layout usually passes params, but we can also get it from pathname
        const pathParts = pathname.split('/');
        const residencialSlug = pathParts[1]; // /residencial-slug/...

        if (residencialSlug) {
            router.push(`/${residencialSlug}/perfil?auto_update_location=true&lat=${newLocation.lat}&lng=${newLocation.lng}`);
            setShowPrompt(false);
        }
    };

    const handleNo = () => {
        // Suppress for 24 hours
        localStorage.setItem('suppress_location_update', new Date().getTime().toString());
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-border animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                        <MapPin size={24} />
                    </div>

                    <h3 className="text-xl font-bold text-text-main mb-2">
                        ¿Actualizar ubicación?
                    </h3>

                    <p className="text-text-secondary text-sm mb-6">
                        Detectamos que estás en una ubicación diferente a la registrada en tu perfil (más de 50m).
                        <br /><br />
                        ¿Quieres actualizar la ubicación de tu casa a tu posición actual?
                    </p>

                    <div className="flex gap-3 w-full">
                        <Button
                            variant="ghost"
                            onClick={handleNo}
                            className="flex-1 border border-border"
                        >
                            No, gracias
                        </Button>
                        <Button
                            onClick={handleYes}
                            className="flex-1"
                        >
                            Sí, actualizar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
