"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapUpdater = ({ center, userLocation, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;

        if (userLocation) {
            const bounds = L.latLngBounds([center, userLocation]);
            map.fitBounds(bounds, { padding: [50, 50] });
        } else {
            map.setView(center, zoom);
        }
    }, [center, userLocation, zoom, map]);
    return null;
};

export default function LeafletMap({
    center,
    zoom,
    radius,
    userLocation,
    userIconUrl,
    darkMode
}) {
    // Custom Icons


    const userIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const tileLayerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            doubleClickZoom={false}
            scrollWheelZoom={false}
            touchZoom={false}
        >
            <TileLayer
                url={tileLayerUrl}
            />
            <Circle
                center={center}
                radius={radius}
                pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }}
            />
            {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                    <Popup>Tu ubicación</Popup>
                </Marker>
            )}
            <MapUpdater center={center} userLocation={userLocation} zoom={zoom} />
        </MapContainer>
    );
}
