"use client";

import React, { useState, useEffect } from "react";
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";
import { X, AlertTriangle, Info, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const CommunityAlertBar = ({ residencialId, residentialSlug }) => {
    const [alerts, setAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
                let targetId = residencialId;

                // If we only have slug, fetch the ID first
                if (!targetId && residentialSlug) {
                    const resDocs = await databases.listDocuments(
                        dbId,
                        "residenciales",
                        [Query.equal("slug", residentialSlug)]
                    );
                    if (resDocs.documents.length > 0) {
                        targetId = resDocs.documents[0].$id;
                    }
                }

                if (!targetId) return;

                const response = await databases.listDocuments(
                    dbId,
                    "avisos_comunidad",
                    [
                        Query.equal("residencial", targetId),
                        // Query.greaterThanEqual("fecha_fin", new Date().toISOString()) // Only active alerts
                    ]
                );

                // Filter out dismissed alerts from localStorage
                const dismissed = JSON.parse(localStorage.getItem("dismissed_alerts") || "[]");

                console.log("Fetched alerts:", response.documents);

                const activeAlerts = response.documents.filter(doc => {
                    if (!doc) return false;

                    // Check if dismissed
                    if (dismissed.includes(doc.$id)) return false;

                    // Check expiration
                    if (doc.duracion_dias && doc.$createdAt) {
                        try {
                            const createdDate = new Date(doc.$createdAt);
                            if (isNaN(createdDate.getTime())) {
                                console.warn("Invalid date for alert:", doc);
                                return true; // Keep it visible if date is invalid, or false to hide? Let's keep it.
                            }
                            const expirationDate = new Date(createdDate.getTime() + (doc.duracion_dias * 24 * 60 * 60 * 1000));
                            const now = new Date();

                            if (now > expirationDate) return false;
                        } catch (e) {
                            console.error("Error calculating expiration:", e);
                            return true;
                        }
                    }

                    return true;
                });

                setAlerts(activeAlerts);
            } catch (error) {
                console.error("Error fetching alerts:", error);
            }
        };

        fetchAlerts();
    }, [residencialId, residentialSlug]);

    // Update CSS variable for layout shifting
    useEffect(() => {
        const root = document.documentElement;
        if (alerts.length > 0 && isVisible) {
            root.style.setProperty('--alert-bar-height', '40px');
        } else {
            root.style.setProperty('--alert-bar-height', '0px');
        }

        return () => {
            root.style.setProperty('--alert-bar-height', '0px');
        };
    }, [alerts.length, isVisible]);

    const handleDismiss = (alertId) => {
        const dismissed = JSON.parse(localStorage.getItem("dismissed_alerts") || "[]");
        localStorage.setItem("dismissed_alerts", JSON.stringify([...dismissed, alertId]));

        const newAlerts = alerts.filter(a => a.$id !== alertId);
        setAlerts(newAlerts);
        setSelectedAlert(null);

        if (newAlerts.length === 0) {
            setIsVisible(false);
        }
    };

    if (alerts.length === 0 || !isVisible) return null;

    return (
        <>
            {/* Fixed Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-white h-10 flex items-center overflow-hidden shadow-md transition-all duration-300">
                <div className="flex-1 flex items-center overflow-hidden relative h-full cursor-pointer" onClick={() => setSelectedAlert(alerts[0])}>
                    <div className="animate-marquee whitespace-nowrap flex items-center gap-8 px-4 font-medium text-sm">
                        {alerts.map((alert, idx) => (
                            <span key={alert.$id} className="flex items-center gap-2">
                                {alert.nivel === 'critical' ? <AlertTriangle size={14} className="text-yellow-300" /> : <Info size={14} />}
                                {alert.titulo}
                                {idx < alerts.length - 1 && <span className="mx-4 text-white/50">•</span>}
                            </span>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="h-full px-3 border border-transparent hover:border-white/50 transition-colors flex items-center justify-center"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Alert Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border">
                        <div className={`p-6 ${selectedAlert.nivel === 'critical' ? 'bg-red-500/10 dark:bg-red-500/20' : 'bg-blue-500/10 dark:bg-blue-500/20'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${selectedAlert.nivel === 'critical' ? 'bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400' : 'bg-blue-500/20 text-blue-600 dark:bg-blue-500/30 dark:text-blue-400'}`}>
                                    {selectedAlert.nivel === 'critical' ? <AlertTriangle size={24} /> : <Bell size={24} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-text-main mb-2">{selectedAlert.titulo}</h3>
                                    <p className="text-text-secondary text-sm leading-relaxed">
                                        {selectedAlert.contenido}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-surface border-t border-border flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedAlert(null)}
                                className="dark:text-text-main"
                            >
                                Cerrar
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => handleDismiss(selectedAlert.$id)}
                                className="text-red-600 dark:text-red-400 hover:bg-surface dark:hover:bg-surface border-red-200 dark:border-red-800 hover:border-red-600"
                            >
                                No quiero ver más este aviso
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
