"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, MessageCircle, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";
import { useToast } from "@/context/ToastContext";

export default function OrderDetailsPage({ params }) {
    const router = useRouter();
    const { residencial, id } = params; // id is numero_pedido
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [hasAutoOpened, setHasAutoOpened] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    // Auto-open WhatsApp when order loads for the first time
    useEffect(() => {
        if (order && !order.mensaje_enviado && !hasAutoOpened) {
            setHasAutoOpened(true);
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                handleContactAdvertiser();
            }, 500);
        }
    }, [order, hasAutoOpened]);

    const fetchOrderDetails = async () => {
        setIsLoading(true);
        try {
            const databases = new Databases(client);
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

            // Query by numero_pedido
            const response = await databases.listDocuments(dbId, "pedidos", [
                Query.equal("numero_pedido", id),
                Query.limit(1)
            ]);

            if (response.documents.length > 0) {
                setOrder(response.documents[0]);
            } else {
                showToast("Pedido no encontrado", "error");
                router.push(`/${residencial}`);
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            showToast("Error al cargar el pedido", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleContactAdvertiser = async () => {
        if (!order) return;

        setIsSendingMessage(true);

        try {
            const databases = new Databases(client);
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

            // Fetch Global Config for Message Template
            let messageTemplate = "";
            try {
                const configResponse = await databases.listDocuments(dbId, "configuracion_global", [
                    Query.limit(1)
                ]);
                if (configResponse.documents.length > 0) {
                    messageTemplate = configResponse.documents[0].msg_pedido || "";
                }
            } catch (configError) {
                console.error("Error fetching config for message template:", configError);
            }

            // Parse items
            const orderItems = JSON.parse(order.items || "[]");

            // Construct items string
            const itemsString = orderItems.map(i => {
                const variantText = i.variant ? ` [${i.variant}]` : '';
                const offerText = i.offer ? ` (${i.offer})` : '';
                const totalLinePrice = i.quantity * i.price;
                const formattedPrice = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalLinePrice);
                return `- ${i.quantity}x ${i.name}${variantText}${offerText} ${formattedPrice}`;
            }).join('\\n');

            const totalFormatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(order.total);

            let message = "";

            if (messageTemplate) {
                message = messageTemplate
                    .replace(/{name}/g, order.comprador_nombre || "")
                    .replace(/{phone}/g, order.comprador_telefono || "")
                    .replace(/{direccion}/g, order.direccion_entrega || "")
                    .replace(/{calle}/g, order.calle || "")
                    .replace(/{manzana}/g, order.manzana || "")
                    .replace(/{lote}/g, order.lote || "")
                    .replace(/{como_llegar}/g, order.como_llegar || "")
                    .replace(/{listado}/g, itemsString)
                    .replace(/{numero_pedido}/g, order.numero_pedido)
                    .replace(/{total}/g, totalFormatted);
            } else {
                // Fallback to default message if no template is set
                message = `Hola veci, soy ${order.comprador_nombre}, de ${order.direccion_entrega}, y quiero encargarle:
${itemsString}

Dígame cuál es la forma de pago por favor.
Este pedido lo he generado por medio de VeciVendo y el número de pedido es ${order.numero_pedido}`;
            }

            const encodedMessage = encodeURIComponent(message);
            const targetPhone = order.anunciante_telefono || "5215555555555";
            const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMessage}`;

            // Update order to mark message as sent
            try {
                await databases.updateDocument(
                    dbId,
                    "pedidos",
                    order.$id,
                    {
                        mensaje_enviado: true
                    }
                );
            } catch (updateError) {
                console.error("Error updating order:", updateError);
            }

            // Open WhatsApp
            window.open(whatsappUrl, '_blank');
            showToast("Abriendo WhatsApp...", "success");

            // Refresh order data
            fetchOrderDetails();

        } catch (error) {
            console.error("Error sending message:", error);
            showToast("Error al generar el mensaje", "error");
        } finally {
            setIsSendingMessage(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin text-primary mb-2" size={32} />
                    <p className="text-text-secondary">Cargando pedido...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    const orderItems = JSON.parse(order.items || "[]");

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'confirmado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'en_proceso': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'completado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'cancelado': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getEstadoLabel = (estado) => {
        switch (estado) {
            case 'pendiente': return 'Pendiente';
            case 'confirmado': return 'Confirmado';
            case 'en_proceso': return 'En Proceso';
            case 'completado': return 'Completado';
            case 'cancelado': return 'Cancelado';
            default: return estado;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-4 border-b border-border">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:border-primary"
                    onClick={() => router.push(`/${residencial}`)}
                >
                    <ArrowLeft size={24} />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-semibold text-text-main">Detalles del Pedido</h1>
                    <p className="text-sm text-text-secondary">{order.numero_pedido}</p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Order Status Card */}
                <div className="bg-surface rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <Package className="text-primary" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-text-main">Estado del Pedido</h2>
                                <p className="text-sm text-text-secondary">Creado el {new Date(order.$createdAt).toLocaleDateString('es-MX', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getEstadoColor(order.estado)}`}>
                            {getEstadoLabel(order.estado)}
                        </span>
                    </div>

                    {order.mensaje_enviado && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <CheckCircle2 size={16} />
                            <span>Mensaje enviado al anunciante</span>
                        </div>
                    )}
                </div>

                {/* Items Card */}
                <div className="bg-surface rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold text-text-main mb-4">Productos</h3>
                    <div className="space-y-3">
                        {orderItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-start py-3 border-b border-border last:border-0">
                                <div className="flex-1">
                                    <p className="font-medium text-text-main">{item.name}</p>
                                    {item.variant && (
                                        <p className="text-sm text-text-secondary">{item.variant}</p>
                                    )}
                                    {item.offer && (
                                        <p className="text-xs text-primary">{item.offer}</p>
                                    )}
                                    <p className="text-sm text-text-secondary mt-1">Cantidad: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-text-main">
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.price * item.quantity)}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.price)} c/u
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                        <span className="text-lg font-semibold text-text-main">Total</span>
                        <span className="text-2xl font-bold text-text-main">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(order.total)}
                        </span>
                    </div>
                </div>

                {/* Delivery Address Card */}
                <div className="bg-surface rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold text-text-main mb-4">Dirección de Entrega</h3>
                    <div className="space-y-2 text-text-secondary">
                        <p className="font-medium text-text-main">{order.comprador_nombre}</p>
                        <p>{order.direccion_entrega}</p>
                        {order.como_llegar && (
                            <p className="text-sm italic mt-2 text-text-secondary">
                                Cómo llegar: {order.como_llegar}
                            </p>
                        )}
                        <p className="text-sm mt-2">Teléfono: {order.comprador_telefono}</p>
                    </div>
                </div>

                {/* Contact Advertiser Button */}
                <div className="sticky bottom-0 bg-background/80 backdrop-blur-md p-4 border-t border-border">
                    <Button
                        className="w-full rounded-xl bg-[#25D366] text-white shadow-lg shadow-green-200/50 dark:shadow-none flex items-center justify-center gap-2 py-6 text-lg border border-transparent hover:border-white disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleContactAdvertiser}
                        disabled={isSendingMessage}
                    >
                        {isSendingMessage ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                Generando mensaje...
                            </>
                        ) : (
                            <>
                                <MessageCircle size={24} />
                                Comunicar con el Anunciante
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-center text-text-secondary mt-2">
                        Se abrirá WhatsApp con un mensaje pre-llenado
                    </p>
                </div>
            </main>
        </div>
    );
}
