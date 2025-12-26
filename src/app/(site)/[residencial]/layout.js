"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import LocationUpdatePrompt from "@/components/access/LocationUpdatePrompt";

export default function ResidentialLayout({ children }) {
    const router = useRouter();
    const params = useParams();
    const { residencial } = params;
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            const checkAccess = async () => {
                // 1. Check LocalStorage for valid access
                const grantedAccess = JSON.parse(localStorage.getItem("granted_access") || "[]");
                const accessRecord = grantedAccess.find(r => r.slug === residencial);

                if (!accessRecord) {
                    console.log("No access record found for:", residencial);
                    router.push(`/?access_denied=${residencial}`);
                    return;
                }

                // Check if access is expired (24 hours)
                const now = new Date().getTime();
                const accessTime = accessRecord.timestamp;
                const hoursElapsed = (now - accessTime) / (1000 * 60 * 60);

                if (hoursElapsed > 24) {
                    console.log("Access expired for:", residencial);
                    // Remove expired record
                    const updatedAccess = grantedAccess.filter(r => r.slug !== residencial);
                    localStorage.setItem("granted_access", JSON.stringify(updatedAccess));
                    router.push(`/?access_denied=${residencial}`);
                    return;
                }

                // 2. Background Geolocation Check (Silent)
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const userLat = position.coords.latitude;
                            const userLng = position.coords.longitude;

                            const resLat = accessRecord.lat;
                            const resLng = accessRecord.lng;
                            const maxRadius = accessRecord.radius || 1609; // Default 1 mile

                            if (resLat && resLng) {
                                const distance = calculateDistance(userLat, userLng, resLat, resLng);
                                if (distance > maxRadius) {
                                    console.log("User moved outside perimeter:", distance);
                                    const updatedAccess = grantedAccess.filter(r => r.slug !== residencial);
                                    localStorage.setItem("granted_access", JSON.stringify(updatedAccess));
                                    router.push(`/?access_denied=${residencial}&reason=perimeter`);
                                }
                            }
                        },
                        (err) => {
                            console.warn("Background geolocation check failed:", err);
                        }
                    );
                }
            };

            checkAccess();
        }, 2000); // 2 seconds delay

        return () => clearTimeout(timer);
    }, [residencial, router]);

    // Helper function for Haversine distance
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // if (checking) block removed

    return (
        <>
            <LocationUpdatePrompt />
            {children}
        </>
    );
}
