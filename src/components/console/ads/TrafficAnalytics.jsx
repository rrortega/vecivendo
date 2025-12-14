"use client";

import { Smartphone, Globe } from "lucide-react";

export default function TrafficAnalytics({ stats }) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Stats */}
            <div className="admin-surface p-6 rounded-xl border admin-border shadow-sm">
                <h3 className="text-lg font-semibold admin-text mb-4 flex items-center gap-2">
                    <Smartphone size={20} className="text-gray-400" />
                    Dispositivos
                </h3>
                <div className="space-y-4">
                    {stats.deviceBreakdown && Object.entries(stats.deviceBreakdown).map(([device, count]) => (
                        <div key={device}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize admin-text">{device}</span>
                                <span className="font-medium admin-text">{count}%</span>
                            </div>
                            <div className="w-full admin-bg rounded-full h-2">
                                <div
                                    className="bg-primary-500 h-2 rounded-full"
                                    style={{ width: `${count}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Traffic Source */}
            <div className="admin-surface p-6 rounded-xl border admin-border shadow-sm">
                <h3 className="text-lg font-semibold admin-text mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-gray-400" />
                    Fuentes de Tráfico
                </h3>
                <div className="space-y-4">
                    {stats.trafficSources && Object.entries(stats.trafficSources).map(([source, count]) => (
                        <div key={source}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize admin-text">{source}</span>
                                <span className="font-medium admin-text">{count}%</span>
                            </div>
                            <div className="w-full admin-bg rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${count}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* OS Stats */}
            <div className="admin-surface p-6 rounded-xl border admin-border shadow-sm">
                <h3 className="text-lg font-semibold admin-text mb-4 flex items-center gap-2">
                    <Smartphone size={20} className="text-gray-400" />
                    Sistema Operativo
                </h3>
                <div className="space-y-4">
                    {stats.osBreakdown && Object.entries(stats.osBreakdown).map(([os, count]) => (
                        <div key={os}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize admin-text">{os}</span>
                                <span className="font-medium admin-text">{count}%</span>
                            </div>
                            <div className="w-full admin-bg rounded-full h-2">
                                <div
                                    className="bg-purple-500 h-2 rounded-full"
                                    style={{ width: `${count}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Browser Stats */}
            <div className="admin-surface p-6 rounded-xl border admin-border shadow-sm">
                <h3 className="text-lg font-semibold admin-text mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-gray-400" />
                    Navegador
                </h3>
                <div className="space-y-4">
                    {stats.browserBreakdown && Object.entries(stats.browserBreakdown).map(([browser, count]) => (
                        <div key={browser}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize admin-text">{browser}</span>
                                <span className="font-medium admin-text">{count}%</span>
                            </div>
                            <div className="w-full admin-bg rounded-full h-2">
                                <div
                                    className="bg-orange-500 h-2 rounded-full"
                                    style={{ width: `${count}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
