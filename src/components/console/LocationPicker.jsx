"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/context/ThemeContext";

// Fix for default marker icon in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function LocationPicker({ lat, lng, radius, onChange }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const circleRef = useRef(null);
    const tileLayerRef = useRef(null);
    const { theme } = useTheme();
    const [resolvedTheme, setResolvedTheme] = useState("light");

    // Default to Mexico City if no coords
    const defaultLat = 19.4326;
    const defaultLng = -99.1332;

    useEffect(() => {
        const updateResolvedTheme = () => {
            if (theme === "system") {
                const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                setResolvedTheme(isDark ? "dark" : "light");
            } else {
                setResolvedTheme(theme);
            }
        };

        updateResolvedTheme();

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            if (theme === "system") {
                updateResolvedTheme();
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    useEffect(() => {
        if (!mapRef.current) return;

        if (!mapInstanceRef.current) {
            const initialLat = lat || defaultLat;
            const initialLng = lng || defaultLng;

            const map = L.map(mapRef.current).setView([initialLat, initialLng], 15);
            mapInstanceRef.current = map;

            // Click handler to move marker
            map.on("click", (e) => {
                const { lat, lng } = e.latlng;
                updatePosition(lat, lng);
            });
        }

        // Update tile layer based on theme
        if (mapInstanceRef.current) {
            if (tileLayerRef.current) {
                tileLayerRef.current.remove();
            }

            const tileUrl = resolvedTheme === "dark"
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

            const attribution = resolvedTheme === "dark"
                ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

            tileLayerRef.current = L.tileLayer(tileUrl, {
                attribution: attribution,
            }).addTo(mapInstanceRef.current);
        }

        // Update marker and circle when props change
        updateMapElements();

    }, [resolvedTheme]); // Re-run when theme changes

    // Effect to update map elements when props change
    useEffect(() => {
        updateMapElements();
    }, [lat, lng, radius]);

    const updatePosition = (newLat, newLng) => {
        onChange({ lat: newLat, lng: newLng, radius });
    };

    const updateMapElements = () => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const currentLat = lat || defaultLat;
        const currentLng = lng || defaultLng;
        const currentRadius = radius || 500; // Default 500m

        // Update Marker
        if (markerRef.current) {
            markerRef.current.setLatLng([currentLat, currentLng]);
        } else {
            markerRef.current = L.marker([currentLat, currentLng], { draggable: true })
                .addTo(map)
                .on("dragend", (e) => {
                    const { lat, lng } = e.target.getLatLng();
                    updatePosition(lat, lng);
                });
        }

        // Update Circle
        if (circleRef.current) {
            circleRef.current.setLatLng([currentLat, currentLng]);
            circleRef.current.setRadius(currentRadius);
        } else {
            circleRef.current = L.circle([currentLat, currentLng], {
                color: "red",
                fillColor: "#f03",
                fillOpacity: 0.2,
                radius: currentRadius,
            }).addTo(map);
        }
    };

    return <div ref={mapRef} className="w-full h-[500px] rounded-lg z-0" />;
}
