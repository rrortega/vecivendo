"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, MoreVertical, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ProfileIncompleteModal } from "@/components/cart/ProfileIncompleteModal";
import { client } from "@/lib/appwrite";
import { Databases, ID } from "appwrite";
import { useToast } from "@/context/ToastContext";

export default function CartPage({ params }) {
    const router = useRouter();
    const { residencial } = params;
    const { cart, removeFromCart, addToCart, clearCart } = useCart(); // Removed getCartTotal from here as we calculate it with fresh data
    const { userProfile } = useUserProfile();
    const { showToast } = useToast();

    const [promoCode, setPromoCode] = useState("");
    const [isPromoApplied, setIsPromoApplied] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [missingFields, setMissingFields] = useState([]);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // New state for menu

    // New state for fresh data
    const [freshItems, setFreshItems] = useState([]);
    const [isLoadingItems, setIsLoadingItems] = useState(true);

    // Fetch fresh data when cart changes
    useEffect(() => {
        const fetchCartDetails = async () => {
            if (cart.length === 0) {
                setFreshItems([]);
                setIsLoadingItems(false);
                return;
            }

            setIsLoadingItems(true);
            const databases = new Databases(client);
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

            try {
                const itemPromises = cart.map(async (cartItem) => {
                    const id = cartItem.$id || cartItem.id;
                    try {
                        const ad = await databases.getDocument(dbId, "anuncios", id);
                        return {
                            ...cartItem, // Keep quantity and other local props
                            ...ad, // Overwrite with fresh DB data
                            id: id, // Ensure ID consistency
                            price: ad.precio, // Use fresh price
                            name: ad.titulo, // Use fresh title
                            image: (ad.imagenes && ad.imagenes.length > 0) ? ad.imagenes[0] : null, // Fresh image
                            isActive: ad.activo !== false // Assume active unless explicitly false
                        };
                    } catch (error) {
                        console.error(`Error fetching ad ${id}:`, error);
                        // If ad not found, mark as unavailable but keep in list so user can remove
                        return {
                            ...cartItem,
                            id: id,
                            name: cartItem.name || "Producto no disponible",
                            price: 0,
                            image: null,
                            isActive: false,
                            error: "not_found"
                        };
                    }
                });

                const results = await Promise.all(itemPromises);
                setFreshItems(results);
            } catch (error) {
                console.error("Error fetching cart details:", error);
                showToast("Error al actualizar precios del carrito", "error");
            } finally {
                setIsLoadingItems(false);
            }
        };

        fetchCartDetails();
    }, [cart]);

    // Helper to map cart items to CartItem component props
    const mappedItems = freshItems.map(item => ({
        ...item,
        // Ensure image is a string URL.
        image: (typeof item.image === 'string' ? item.image : null) ||
            (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null) ||
            "https://via.placeholder.com/200",
        price: parseFloat(item.price || 0)
    }));

    const handleUpdateQuantity = (id, newQuantity) => {
        if (newQuantity < 1) return;

        const item = cart.find(i => (i.$id || i.id) === id);
        if (!item) return;

        const currentQty = item.quantity;
        const delta = newQuantity - currentQty;

        if (delta !== 0) {
            addToCart(item, delta);
        }
    };

    const handleRemove = (id) => {
        removeFromCart(id);
    };

    const handleApplyPromo = () => {
        if (promoCode.toUpperCase() === "ADJ3AK") {
            setIsPromoApplied(true);
            showToast("Código promocional aplicado", "success");
        } else {
            showToast("Código inválido", "error");
        }
    };

    // Calculate totals using FRESH items
    const subtotal = mappedItems.reduce((acc, item) => {
        if (!item.isActive || item.error) return acc;
        return acc + (item.price * item.quantity);
    }, 0);

    const deliveryFee = 0;
    const discount = isPromoApplied ? subtotal * 0.40 : 0;
    const total = subtotal + deliveryFee - discount;

    const validateProfile = () => {
        const missing = [];
        if (!userProfile.nombre) missing.push('nombre');
        if (!userProfile.telefono || !userProfile.telefono_verificado) missing.push('telefono');
        if (!userProfile.calle || !userProfile.manzana || !userProfile.lote || !userProfile.casa) missing.push('direccion');
        if (!userProfile.lat || !userProfile.lng) missing.push('ubicacion');

        setMissingFields(missing);
        return missing.length === 0;
    };

    const handleCreateOrder = async () => {
        const activeItems = mappedItems.filter(i => i.isActive && !i.error);

        if (activeItems.length === 0) {
            showToast("No hay productos disponibles para ordenar", "error");
            return;
        }

        if (!validateProfile()) {
            setIsProfileModalOpen(true);
            return;
        }

        setIsCreatingOrder(true);

        try {
            const databases = new Databases(client);
            const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

            // Generate Order ID
            const timestamp = Date.now();
            const orderId = `VV${timestamp}`;

            // Prepare items for storage using FRESH data
            const orderItems = activeItems.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                variant: item.variant || null
            }));

            // Get Residential ID from first item
            const residentialId = activeItems[0].residential_id || activeItems[0].residencialId || activeItems[0].residencial_id || "unknown";
            // Use fresh advertiser info if available, otherwise fallback
            const advertiserPhone = activeItems[0].advertiser_phone || activeItems[0].telefono_anunciante || activeItems[0].user_phone || activeItems[0].telefono;

            // Create Order in Appwrite
            await databases.createDocument(
                dbId,
                "orders",
                ID.unique(),
                {
                    order_id: orderId,
                    user_id: userProfile.userId || "guest",
                    user_name: userProfile.nombre,
                    user_phone: userProfile.telefono,
                    user_address: `${userProfile.calle} Mz ${userProfile.manzana} Lt ${userProfile.lote} #${userProfile.casa}`,
                    items: JSON.stringify(orderItems),
                    total: total,
                    status: "pending",
                    residential_id: residentialId
                }
            );

            // Construct WhatsApp Message
            const addressString = `${userProfile.calle} Mz ${userProfile.manzana} Lt ${userProfile.lote} #${userProfile.casa}`;
            const itemsString = orderItems.map(i => `- ${i.quantity}x ${i.name}`).join('\n');

            const message = `Hola veci, soy ${userProfile.nombre}, de la calle ${userProfile.calle} manzana ${userProfile.manzana} lote ${userProfile.lote} y casa ${userProfile.casa}, y quiero encargarle:
${itemsString}

Dígame cuál es la forma de pago por favor.
Este pedido lo he generado por medio de VeciVendo donde está colgado su anuncio y el id de la orden es ${orderId}`;

            const encodedMessage = encodeURIComponent(message);

            const targetPhone = advertiserPhone || "5215555555555";

            const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMessage}`;

            showToast(`Pedido ${orderId} creado exitosamente`, "success");

            // Clear cart
            clearCart();

            // Redirect
            window.location.href = whatsappUrl;

        } catch (error) {
            console.error("Error creating order:", error);
            showToast("Error al crear el pedido. Intenta nuevamente.", "error");
        } finally {
            setIsCreatingOrder(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:border-primary"
                        onClick={() => router.push(`/${residencial || 'demo'}`)} // Redirect to residential home
                    >
                        <ArrowLeft size={24} />
                    </Button>
                    <h1 className="text-xl font-semibold text-text-main">Mi Carrito</h1>
                </div>
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:border-primary"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <MoreVertical size={24} />
                    </Button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl shadow-lg border border-border z-50 overflow-hidden">
                                <button
                                    onClick={() => {
                                        clearCart();
                                        setIsMenuOpen(false);
                                        showToast("Carrito limpiado", "success");
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-red-500 border border-transparent hover:border-red-500 transition-colors flex items-center gap-2"
                                >
                                    <span className="font-medium">Limpiar carrito</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </header >

            <main className="flex-grow px-4 pt-4 pb-24 lg:pb-8 max-w-7xl mx-auto w-full">
                {isLoadingItems ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="animate-spin text-primary mb-2" size={32} />
                        <p className="text-text-secondary">Actualizando precios...</p>
                    </div>
                ) : mappedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
                        <p className="text-lg mb-4">Tu carrito está vacío</p>
                        <Button onClick={() => router.push(`/${residencial || 'demo'}`)}>Ir a comprar</Button>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row lg:gap-8">
                        {/* Left Column: Items */}
                        <div className="flex-1 lg:w-2/3">
                            {/* Items List */}
                            <div className="mb-6 space-y-4">
                                {mappedItems.map((item) => (
                                    <div key={item.id} className={(!item.isActive || item.error) ? "opacity-50 grayscale relative" : ""}>
                                        {(!item.isActive || item.error) && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                    {item.error === 'not_found' ? 'No disponible' : 'Inactivo'}
                                                </span>
                                            </div>
                                        )}
                                        <CartItem
                                            item={item}
                                            residencial={residencial || 'demo'} // Pass residential slug
                                            onUpdateQuantity={handleUpdateQuantity}
                                            onRemove={handleRemove}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Promo Code */}
                            <div className="mb-6">
                                <div className="relative">
                                    <Input
                                        placeholder="Código Promocional"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        className="pr-24"
                                    />
                                    {!isPromoApplied && (
                                        <Button
                                            size="sm"
                                            className="absolute right-1 top-1 bottom-1 h-auto px-4 rounded-lg"
                                            onClick={handleApplyPromo}
                                        >
                                            Aplicar
                                        </Button>
                                    )}
                                    {isPromoApplied && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-500 text-sm font-medium">
                                            <CheckCircle size={16} />
                                            <span>Aplicado</span>
                                        </div>
                                    )}
                                </div>
                                {isPromoApplied && (
                                    <p className="text-xs text-green-600 mt-2 ml-1">Código aplicado (40% OFF)</p>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Summary & Address (Desktop Only) */}
                        <div className="hidden lg:block lg:w-1/3 space-y-6">
                            {/* Address Card */}
                            <div className="bg-surface p-6 rounded-xl border border-border">
                                <h3 className="font-semibold text-text-main mb-4 flex items-center gap-2">
                                    <span className="bg-primary/10 p-2 rounded-full text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                    </span>
                                    Dirección de entrega
                                </h3>
                                <div className="text-sm text-text-secondary space-y-1">
                                    {userProfile.calle ? (
                                        <>
                                            <p className="font-medium text-text-main">{userProfile.nombre}</p>
                                            <p>{userProfile.calle} {userProfile.lote ? `, Lote ${userProfile.lote}` : ''}</p>
                                            <p>{userProfile.casa ? `Casa/Depto ${userProfile.casa}` : ''}</p>
                                            <p className="text-xs mt-2 italic">{userProfile.ubicacion}</p>
                                        </>
                                    ) : (
                                        <p className="italic text-yellow-600">
                                            No has configurado tu dirección. Se te pedirá al confirmar.
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full mt-4 text-xs"
                                    onClick={() => router.push(`/${residencial || 'demo'}/perfil`)}
                                >
                                    Editar dirección
                                </Button>
                            </div>

                            {/* Desktop Summary Card */}
                            <div className="bg-surface p-6 rounded-xl border border-border sticky top-24">
                                <h3 className="font-semibold text-text-main mb-4">Resumen del pedido</h3>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm text-text-secondary">
                                        <span>Subtotal:</span>
                                        <span className="font-medium text-text-main">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-text-secondary">
                                        <span>Envío:</span>
                                        <span className="font-medium text-text-main">${deliveryFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-text-secondary">
                                        <span>Descuento:</span>
                                        <span className="font-medium text-text-main">-${discount.toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-border my-2" />
                                    <div className="flex justify-between items-end">
                                        <span className="text-lg font-bold text-text-main">Total:</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-text-main block">
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)} MXN
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full rounded-xl bg-[#25D366] text-white shadow-lg shadow-green-200/50 dark:shadow-none flex items-center justify-center gap-2 py-6 text-lg border border-transparent hover:border-white"
                                    onClick={handleCreateOrder}
                                >
                                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    Iniciar pedido
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Footer Disclaimer */}
                {!isLoadingItems && mappedItems.length > 0 && (
                    <div className="hidden lg:block mt-12 pt-8 border-t border-border text-center">
                        <div className="max-w-4xl mx-auto text-sm text-text-secondary space-y-2">
                            <p>
                                El pedido se enviará directamente al anunciante por WhatsApp, pero dejará un registro en VeciVendo para que puedas luego dejar un review del servicio y sirva de reputación para el anunciante.
                            </p>
                            <p>
                                VeciVendo no cobra comisión por conectar oferta y demanda, es totalmente gratis. Pero si te genera valor y quieres ayudar a mantenerlo puedes donar lo que te costaría un café para que sigamos mejorando la plataforma.
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile Summary (Fixed Bottom) */}
            {
                !isLoadingItems && mappedItems.length > 0 && (
                    <div className="lg:hidden">
                        <CartSummary
                            subtotal={subtotal}
                            deliveryFee={deliveryFee}
                            discount={discount}
                            total={total}
                            onCheckout={handleCreateOrder}
                        />
                    </div>
                )
            }

            {/* Loading Overlay */}
            {
                isCreatingOrder && (
                    <div className="fixed inset-0 z-[7000] bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-surface p-6 rounded-2xl flex flex-col items-center">
                            <Loader2 className="animate-spin text-primary mb-2" size={32} />
                            <p className="text-text-main font-medium">Creando pedido...</p>
                        </div>
                    </div>
                )
            }

            <ProfileIncompleteModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                missingFields={missingFields}
                residentialSlug={residencial || 'demo'}
            />
        </div >
    );
}
