"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './Button';
import { MapPin, Maximize2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { useToast } from "@/context/ToastContext";

// ... (imports)

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
}

function LocationMarker({ position, setPosition, interactive, center, radius, showToast }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        } else if (center) {
            map.flyTo(center, map.getZoom());
        }
    }, [position, center, map]);

    useMapEvents({
        click(e) {
            if (interactive) {
                const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
                if (center && radius) {
                    const distance = map.distance(e.latlng, center);
                    if (distance <= radius) {
                        setPosition(newPos);
                    } else {
                        showToast("La ubicación debe estar dentro del residencial.", "error");
                    }
                } else {
                    setPosition(newPos);
                }
            }
        },
    });

    return position === null ? null : (
        <Marker
            position={position}
            draggable={interactive}
            eventHandlers={{
                dragend: (e) => {
                    if (interactive) {
                        const latLng = e.target.getLatLng();
                        const newPos = { lat: latLng.lat, lng: latLng.lng };
                        if (center && radius) {
                            const distance = map.distance(latLng, center);
                            if (distance <= radius) {
                                setPosition(newPos);
                            } else {
                                e.target.setLatLng(position); // Reset to last valid
                                showToast("La ubicación debe estar dentro del residencial.", "error");
                            }
                        } else {
                            setPosition(newPos);
                        }
                    }
                },
            }}
        />
    );
}

export default function LocationPicker({ initialLat, initialLng, onLocationSelect, residentialName, residentialCenter, residentialRadius }) {
    console.log("LocationPicker Props:", { residentialCenter, residentialRadius });
    const { showToast } = useToast();
    // ... (rest of component)
    // Default to Cancun coordinates if no initial position
    const defaultPosition = { lat: 21.1619, lng: -86.8515 };
    const center = residentialCenter || defaultPosition;

    const [position, setPosition] = useState(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : center
    );
    const [isExpanded, setIsExpanded] = useState(false);
    const [tempPosition, setTempPosition] = useState(position);

    useEffect(() => {
        if (initialLat && initialLng) {
            const newPos = { lat: initialLat, lng: initialLng };
            setPosition(newPos);
            setTempPosition(newPos);
        } else {
            // Try to get user's current location if no initial coords
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const { latitude, longitude } = pos.coords;
                        const userPos = { lat: latitude, lng: longitude };

                        // If we have residential constraints, validate the position
                        if (residentialCenter && residentialRadius) {
                            // Simple distance calculation (Haversine not strictly needed for short distances, but Leaflet map.distance is better if available. 
                            // Since we don't have the map instance here easily without a wrapper, we can use a simple approximation or just set it and let the user adjust.
                            // However, to be safe and consistent with the "limit" requirement:
                            const R = 6371e3; // metres
                            const φ1 = userPos.lat * Math.PI / 180;
                            const φ2 = residentialCenter.lat * Math.PI / 180;
                            const Δφ = (residentialCenter.lat - userPos.lat) * Math.PI / 180;
                            const Δλ = (residentialCenter.lng - userPos.lng) * Math.PI / 180;

                            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                                Math.cos(φ1) * Math.cos(φ2) *
                                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                            const d = R * c;

                            if (d <= residentialRadius) {
                                setPosition(userPos);
                                setTempPosition(userPos);
                            } else {
                                console.log("User location is outside residential radius");
                            }
                        } else {
                            // No constraints, just use it
                            setPosition(userPos);
                            setTempPosition(userPos);
                        }
                    },
                    (err) => {
                        console.error("Error getting location:", err);
                    }
                );
            }
        }
    }, [initialLat, initialLng, residentialCenter, residentialRadius]);

    const handleExpand = () => {
        setTempPosition({ ...position });
        setIsExpanded(true);
    };

    const handleConfirm = () => {
        setPosition({ ...tempPosition });
        onLocationSelect(tempPosition.lat, tempPosition.lng);
        setIsExpanded(false);
    };

    const handleCancel = () => {
        setTempPosition({ ...position });
        setIsExpanded(false);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary mb-1">Ubicación en el mapa</label>

            {/* Preview Map */}
            <motion.div
                layoutId="map-container"
                className="relative h-48 rounded-xl overflow-hidden border border-border group cursor-pointer hover:border-primary transition-colors duration-300"
                onClick={handleExpand}
            >
                {/* Transparent overlay for full clickability */}
                <div className="absolute inset-0 z-10 bg-transparent" />

                <MapContainer
                    center={position}
                    zoom={15}
                    scrollWheelZoom={false}
                    dragging={false}
                    zoomControl={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    <ChangeView center={position} zoom={15} />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker
                        position={position}
                        interactive={false}
                        setPosition={setPosition}
                        center={residentialCenter}
                        radius={residentialRadius}
                        showToast={showToast}
                    />
                    {residentialCenter && residentialRadius && (
                        <Circle
                            center={residentialCenter}
                            radius={residentialRadius}
                            pathOptions={{ color: '#FD366E', fillColor: '#FD366E', fillOpacity: 0.2, weight: 2 }}
                        />
                    )}
                </MapContainer>

                <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none z-20">
                    <div className="bg-surface/90 backdrop-blur text-text-main px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium border border-transparent group-hover:border-primary group-hover:text-primary transition-colors duration-300">
                        <MapPin size={16} />
                        {initialLat ? 'Cambiar ubicación' : 'Ubicar mi casa'}
                    </div>
                </div>
            </motion.div>

            <p className="text-xs text-text-secondary">
                {initialLat
                    ? "Toca el mapa para ajustar la ubicación exacta de tu casa."
                    : "Es necesario ubicar tu casa en el mapa para facilitar las entregas."}
            </p>

            {/* Expanded Map Modal */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[5000] bg-background/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4"
                    >
                        <motion.div
                            layoutId="map-container"
                            className="bg-background w-full h-full md:h-[80vh] md:w-[90vw] md:max-w-4xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border"
                        >
                            <div className="p-4 border-b border-border flex items-center justify-between bg-surface z-10">
                                <h3 className="font-bold text-lg text-text-main">Ubica tu casa</h3>
                                <Button
                                    variant="ghost"
                                    onClick={handleCancel}
                                    className="hover:border-primary hover:text-text-main"
                                >
                                    <X size={24} />
                                </Button>
                            </div>

                            <div className="flex-1 relative">
                                <MapContainer
                                    center={tempPosition}
                                    zoom={16}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <LocationMarker
                                        position={tempPosition}
                                        setPosition={setTempPosition}
                                        interactive={true}
                                        center={residentialCenter}
                                        radius={residentialRadius}
                                        showToast={showToast}
                                    />
                                    {residentialCenter && residentialRadius && (
                                        <Circle
                                            center={residentialCenter}
                                            radius={residentialRadius}
                                            pathOptions={{ color: '#FD366E', fillColor: '#FD366E', fillOpacity: 0.2, weight: 2 }}
                                        />
                                    )}
                                </MapContainer>

                                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-surface/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000] text-sm text-text-main font-medium pointer-events-none text-center w-max max-w-[90%]">
                                    Arrastra el pin a tu casa.<br />
                                    <span className="text-xs text-text-secondary">Debe estar dentro del círculo azul.</span>
                                </div>
                            </div>

                            <AnimatePresence>
                                {JSON.stringify(position) !== JSON.stringify(tempPosition) && (
                                    <motion.div
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 100, opacity: 0 }}
                                        className="p-4 bg-surface border-t border-border z-10"
                                    >
                                        <Button
                                            onClick={handleConfirm}
                                            className="w-full h-12 text-lg font-semibold bg-primary text-white border-transparent hover:bg-primary hover:border-primary-dark transition-colors"
                                        >
                                            <Check className="mr-2" />
                                            Confirmar Ubicación
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
