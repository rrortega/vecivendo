"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, MessageCircle, CheckCircle2, Package, X, AlertCircle, Edit, Star } from "lucide-react";
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
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Review State
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

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

    const handleUpdateStatus = async (newStatus) => {
        if (!order) return;
        setIsUpdatingStatus(true);
        try {
            const databases = new Databases(client);
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

            await databases.updateDocument(
                dbId,
                "pedidos",
                order.$id,
                {
                    estado: newStatus
                }
            );

            showToast(`Pedido marcado como ${newStatus}`, "success");
            setIsStatusModalOpen(false);
            fetchOrderDetails(); // Refresh data
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Error al actualizar el estado", "error");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleSubmitReview = async () => {
        if (reviewRating === 0) {
            showToast("Por favor selecciona una calificación", "error");
            return;
        }

        setIsSubmittingReview(true);
        try {
            const databases = new Databases(client);
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

            // Get ad ID from first item
            const items = JSON.parse(order.items || "[]");
            if (items.length === 0) {
                showToast("No se pudo identificar el anuncio", "error");
                return;
            }
            const anuncioId = items[0].id;

            await databases.createDocument(
                dbId,
                "reviews",
                "unique()",
                {
                    anuncio_id: anuncioId,
                    puntuacion: reviewRating,
                    comentario: reviewComment,
                    autor_nombre: order.comprador_nombre || "Anónimo"
                }
            );

            showToast("¡Gracias por tu reseña!", "success");
            setHasReviewed(true);
        } catch (error) {
            console.error("Error submitting review:", error);
            showToast("Error al enviar la reseña", "error");
        } finally {
            setIsSubmittingReview(false);
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
                {/* Header Info Card */}
                <div className="bg-surface rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Package className="text-primary" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-text-main">Pedido #{order.numero_pedido}</h2>
                            <p className="text-sm text-text-secondary">
                                Realizado el {new Date(order.$createdAt).toLocaleDateString('es-MX', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Timeline & Status */}
                <div className="bg-surface rounded-xl border border-border p-6 border shadow-sm">
                    <h3 className="text-lg font-semibold text-text-main mb-6">Progreso del Pedido</h3>

                    {/* Timeline */}
                    <div className="relative flex justify-between items-start mb-8">
                        {/* Connecting Line - Aligned with circles (h-8 -> center at h-4/top-4) */}
                        <div className="absolute top-4 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
                        <div
                            className="absolute top-4 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                            style={{
                                width: order.estado === 'completado' || order.estado === 'cancelado' ? '100%' :
                                    order.estado === 'pendiente' || order.estado === 'confirmado' || order.estado === 'en_proceso' ? '50%' : '0%'
                            }}
                        ></div>

                        {/* Step 1: Ordenado */}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                                <CheckCircle2 size={16} />
                            </div>
                            <span className="text-xs font-medium text-text-main">Ordenado</span>
                        </div>

                        {/* Step 2: Pendiente */}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${['pendiente', 'confirmado', 'en_proceso', 'completado', 'cancelado'].includes(order.estado)
                                ? 'bg-primary text-white'
                                : 'bg-gray-200 text-gray-400'
                                }`}>
                                {['completado', 'cancelado'].includes(order.estado) ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">2</span>}
                            </div>
                            <span className="text-xs font-medium text-text-main">Pendiente</span>
                        </div>

                        {/* Step 3: Finalizado */}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${['completado', 'cancelado'].includes(order.estado)
                                ? (order.estado === 'cancelado' ? 'bg-red-500 text-white' : 'bg-primary text-white')
                                : 'bg-gray-200 text-gray-400'
                                }`}>
                                {order.estado === 'completado' ? <CheckCircle2 size={16} /> :
                                    order.estado === 'cancelado' ? <X size={16} /> :
                                        <span className="text-xs font-bold">3</span>}
                            </div>
                            <span className="text-xs font-medium text-text-main">
                                {order.estado === 'cancelado' ? 'Cancelado' : 'Completado'}
                            </span>
                        </div>
                    </div>

                    {/* Status Action Button */}
                    <div className="flex justify-center border-t border-border pt-6">
                        {order.estado === 'pendiente' ? (
                            <button
                                onClick={() => setIsStatusModalOpen(true)}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium ${getEstadoColor(order.estado)} hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md`}
                            >
                                {getEstadoLabel(order.estado)}
                                <Edit size={16} />
                            </button>
                        ) : (
                            <div className={`px-6 py-2 rounded-full text-sm font-medium ${getEstadoColor(order.estado)} flex items-center gap-2`}>
                                {order.estado === 'completado' && <CheckCircle2 size={16} />}
                                {order.estado === 'cancelado' && <X size={16} />}
                                {getEstadoLabel(order.estado)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Review Section (Only if Completed) */}
                {order.estado === 'completado' && !hasReviewed && (
                    <div className="bg-surface rounded-xl border border-border p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-lg font-semibold text-text-main mb-2">Califica el servicio</h3>
                        <p className="text-sm text-text-secondary mb-4">Ayuda a otros vecinos contando tu experiencia.</p>

                        <div className="flex flex-col gap-4">
                            <div className="flex justify-center gap-2 py-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setReviewRating(star)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <Star
                                            size={32}
                                            className={`${star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} transition-colors`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                placeholder="Escribe un comentario (opcional)..."
                                rows={3}
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                            />

                            <Button
                                onClick={handleSubmitReview}
                                disabled={isSubmittingReview || reviewRating === 0}
                                className="w-full"
                            >
                                {isSubmittingReview ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={18} />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar Calificación"
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Review Success Message */}
                {hasReviewed && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 rounded-xl p-6 text-center animate-in zoom-in-95">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Star className="text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">¡Gracias por tu opinión!</h3>
                        <p className="text-green-600 dark:text-green-400 text-sm">Tu reseña ayuda a mejorar la comunidad.</p>
                    </div>
                )}


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
                {!['completado', 'cancelado'].includes(order.estado) && (
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
                )}
            </main>

            {/* Status Change Modal */}
            {
                isStatusModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-semibold text-lg text-text-main">Actualizar Estado del Pedido</h3>
                                <Button variant="ghost" size="icon" onClick={() => setIsStatusModalOpen(false)}>
                                    <X size={20} />
                                </Button>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-col items-center text-center mb-6">
                                    <AlertCircle size={48} className="text-primary mb-4 opacity-80" />
                                    <p className="text-text-secondary">
                                        ¿Qué acción deseas realizar con este pedido?
                                        <br />
                                        Esta acción actualizará el estado inmediatamente.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <Button
                                        className="bg-green-600 hover:bg-green-700 text-white w-full py-6 text-lg"
                                        onClick={() => handleUpdateStatus('completado')}
                                        disabled={isUpdatingStatus}
                                    >
                                        {isUpdatingStatus ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                                        Marcar como Completado
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="w-full py-6 text-lg"
                                        onClick={() => handleUpdateStatus('cancelado')}
                                        disabled={isUpdatingStatus}
                                    >
                                        {isUpdatingStatus ? <Loader2 className="animate-spin mr-2" /> : <X className="mr-2" />}
                                        Cancelar Pedido
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
