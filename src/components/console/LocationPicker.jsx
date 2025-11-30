"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

    // Default to Mexico City if no coords
    const defaultLat = 19.4326;
    const defaultLng = -99.1332;

    useEffect(() => {
        if (!mapRef.current) return;

        if (!mapInstanceRef.current) {
            const initialLat = lat || defaultLat;
            const initialLng = lng || defaultLng;

            const map = L.map(mapRef.current).setView([initialLat, initialLng], 15);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);

            mapInstanceRef.current = map;

            // Click handler to move marker
            map.on("click", (e) => {
                const { lat, lng } = e.latlng;
                updatePosition(lat, lng);
            });
        }

        // Update marker and circle when props change
        updateMapElements();

    }, []); // Run once on mount to init map

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

        // Center map if it's the first load with valid coords
        // (Optional logic to avoid jumping around too much)
    };

    return <div ref={mapRef} className="w-full h-[500px] rounded-lg z-0" />;
}
