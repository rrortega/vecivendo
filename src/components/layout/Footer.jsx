"use client";

import React, { useEffect, useState } from "react";
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";
import { Facebook, Instagram, Twitter, Phone, Mail, Heart, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const Footer = () => {
    const [config, setConfig] = useState({
        facebook: "",
        instagram: "",
        twitter: "",
        telefono_asistencia: "+52 55 1234 5678",
        email_contacto: "contacto@vecivendo.com"
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                // Try to fetch general configuration
                const response = await databases.listDocuments(
                    dbId,
                    "configuracion_global",
                    [Query.limit(1)]
                );

                if (response.documents.length > 0) {
                    const data = response.documents[0];
                    setConfig({
                        facebook: data.facebook_link || "",
                        instagram: data.instagram_link || "",
                        twitter: data.twitter_link || "",
                        linkedin: data.linkedin_link || "",
                        telefono_asistencia: data.whatsapp_asistencia || "+52 55 1234 5678",
                        email_contacto: data.email_soporte || "contacto@vecivendo.com"
                    });
                }
            } catch (error) {
                console.warn("Could not fetch footer config, using defaults:", error);
            }
        };

        fetchConfig();
    }, []);

    return (
        <footer className="bg-gray-900 text-white pt-16 pb-8 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center">
                                <img src="/vecivendo_logo_primary.png" alt="Vecivendo" className="w-8 h-8 object-contain rounded-[12px]" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">
                                Vecivendo
                            </h2>
                        </div>
                        <p className="text-gray-100 mb-6 max-w-xs">
                            Conectando comunidades, facilitando el comercio local y fortaleciendo la seguridad vecinal.
                        </p>
                        <div className="flex gap-4">
                            {config.facebook && (
                                <a href={config.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full border border-transparent hover:border-primary hover:scale-110 transition-all duration-300">
                                    <Facebook size={20} />
                                </a>
                            )}
                            {config.instagram && (
                                <a href={config.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full border border-transparent hover:border-pink-600 hover:scale-110 transition-all duration-300">
                                    <Instagram size={20} />
                                </a>
                            )}
                            {config.twitter && (
                                <a href={config.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 rounded-full border border-transparent hover:border-blue-400 hover:scale-110 transition-all duration-300">
                                    <Twitter size={20} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className="text-lg font-bold mb-6 text-white">Contacto y Asistencia</h3>
                        <div className="space-y-4">
                            <a href={`tel:${config.telefono_asistencia.replace(/\s/g, '')}`} className="flex items-center gap-3 text-gray-100 hover:text-white transition-colors group">
                                <div className="p-2 bg-white/5 rounded-lg border border-transparent group-hover:border-primary/50 transition-colors">
                                    <Phone size={18} className="text-primary" />
                                </div>
                                <span className="font-medium">{config.telefono_asistencia}</span>
                            </a>
                            <a href={`mailto:${config.email_contacto}`} className="flex items-center gap-3 text-gray-100 hover:text-white transition-colors group">
                                <div className="p-2 bg-white/5 rounded-lg border border-transparent group-hover:border-primary/50 transition-colors">
                                    <Mail size={18} className="text-primary" />
                                </div>
                                <span className="font-medium">{config.email_contacto}</span>
                            </a>
                            <div className="flex items-center gap-3 text-gray-100">
                                <div className="p-2 bg-white/5 rounded-lg">
                                    <ShieldCheck size={18} className="text-green-400" />
                                </div>
                                <span className="text-sm">Soporte 24/7 para emergencias</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className="text-lg font-bold mb-6 text-white">Enlaces Rápidos</h3>
                        <ul className="space-y-3 text-gray-100">
                            <li>
                                <Link href="/legal/sobre-nosotros" className="hover:text-white hover:translate-x-1 transition-all inline-block">
                                    Sobre Nosotros
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/terminos-y-condiciones" className="hover:text-white hover:translate-x-1 transition-all inline-block">
                                    Términos y Condiciones
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/politica-de-privacidad" className="hover:text-white hover:translate-x-1 transition-all inline-block">
                                    Política de Privacidad
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="hidden hover:text-white hover:translate-x-1 transition-all inline-block">
                                    Preguntas Frecuentes
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-8" />

                {/* Bottom Footer */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <span>Powered by</span>
                        <span className="font-bold text-white tracking-wide">ChambaPRO SAPI DE CV</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span>Hecho con</span>
                        <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
                        <span>para tu comunidad</span>
                    </div>
                    <div>
                        © {new Date().getFullYear()} Todos los derechos reservados.
                    </div>
                </div>
            </div>
        </footer>
    );
};
