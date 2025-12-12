"use client";

import { useState } from "react";
import { Plus, Trash2, Package, Tag, DollarSign, Percent } from "lucide-react";

export default function VariantsManager({ variants = [], onChange }) {
    const [activeVariant, setActiveVariant] = useState(0);

    // Helper for safe Base64 encoding/decoding with UTF-8 support
    const safeAtob = (str) => {
        try {
            return decodeURIComponent(escape(atob(str)));
        } catch (e) {
            console.warn("UTF-8 decode failed, falling back to atob", e);
            return atob(str);
        }
    };

    const safeBtoa = (str) => {
        try {
            return btoa(unescape(encodeURIComponent(str)));
        } catch (e) {
            console.error("UTF-8 encode failed", e);
            return btoa(str);
        }
    };

    // Decodificar variantes desde base64
    const decodedVariants = variants.map((variant, index) => {
        try {
            // Si ya es un objeto, devolverlo tal cual (por si acaso)
            if (typeof variant === 'object' && variant !== null) return variant;

            // Intentar decodificar base64
            const decoded = safeAtob(variant);
            return JSON.parse(decoded);
        } catch (error) {
            console.error(`Error decoding variant at index ${index}:`, error, variant);
            // Intentar parsear como JSON directo por si no es base64
            try {
                return JSON.parse(variant);
            } catch (e) {
                console.error(`Error parsing variant as JSON at index ${index}:`, e);
                return null;
            }
        }
    }).filter(Boolean);

    console.log("VariantsManager received:", variants);
    console.log("Decoded variants:", decodedVariants);

    const handleAddVariant = () => {
        const newVariant = {
            name: "",
            kind: "single",
            units: null,
            unit_price: null,
            total_price: null,
            currency: "MXN",
            price_raw: null,
            offer: null
        };

        const encoded = safeBtoa(JSON.stringify(newVariant));
        onChange([...variants, encoded]);
        setActiveVariant(decodedVariants.length);
    };

    const handleRemoveVariant = (index) => {
        const newVariants = variants.filter((_, i) => i !== index);
        onChange(newVariants);
        if (activeVariant >= newVariants.length) {
            setActiveVariant(Math.max(0, newVariants.length - 1));
        }
    };

    const handleVariantChange = (index, field, value) => {
        const variant = decodedVariants[index];
        const updated = { ...variant, [field]: value };
        const encoded = safeBtoa(JSON.stringify(updated));
        const newVariants = [...variants];
        newVariants[index] = encoded;
        onChange(newVariants);
    };

    const handleOfferChange = (index, field, value) => {
        const variant = decodedVariants[index];
        const offer = variant.offer || {
            type: null,
            label: null,
            discount_percent: null,
            min_quantity: null,
            raw: null
        };

        const updated = {
            ...variant,
            offer: { ...offer, [field]: value }
        };

        const encoded = safeBtoa(JSON.stringify(updated));
        const newVariants = [...variants];
        newVariants[index] = encoded;
        onChange(newVariants);
    };

    const handleRemoveOffer = (index) => {
        handleVariantChange(index, 'offer', null);
    };

    const handleAddOffer = (index) => {
        handleOfferChange(index, 'type', 'percent');
    };

    if (decodedVariants.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed admin-border rounded-xl">
                <Package className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium admin-text mb-2">Sin variantes</h3>
                <p className="text-sm admin-text-muted mb-4">
                    Agrega variantes para ofrecer diferentes presentaciones del producto
                </p>
                <button
                    type="button"
                    onClick={handleAddVariant}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-surface  hover:border text-white rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Agregar Primera Variante
                </button>
            </div>
        );
    }

    const currentVariant = decodedVariants[activeVariant];

    return (
        <div className="space-y-4">
            {/* Tabs de variantes */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {decodedVariants.map((variant, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => setActiveVariant(index)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap ${activeVariant === index
                            ? 'bg-surface  border-primary-600'
                            : 'admin-bg admin-text admin-border hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <Package size={16} />
                        {variant.name || `Variante ${index + 1}`}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={handleAddVariant}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed admin-border admin-text hover:border-primary-600 hover:text-primary-600 transition-colors whitespace-nowrap"
                >
                    <Plus size={16} />
                    Nueva Variante
                </button>
            </div>

            {/* Formulario de la variante activa */}
            <div className="admin-surface border admin-border rounded-xl p-6 space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium admin-text">Nombre de la Variante *</label>
                        <input
                            type="text"
                            value={currentVariant.name}
                            onChange={(e) => handleVariantChange(activeVariant, 'name', e.target.value)}
                            placeholder="Ej: 1 Litro, Pack de 6, Talla M"
                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium admin-text">Tipo</label>
                        <select
                            value={currentVariant.kind}
                            onChange={(e) => handleVariantChange(activeVariant, 'kind', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="single">Individual</option>
                            <option value="bundle">Paquete</option>
                        </select>
                    </div>
                </div>

                {/* Precios y cantidades */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium admin-text">Unidades</label>
                        <input
                            type="number"
                            value={currentVariant.units || ''}
                            onChange={(e) => handleVariantChange(activeVariant, 'units', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="Cantidad"
                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium admin-text">Precio Unitario</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="number"
                                step="0.01"
                                value={currentVariant.unit_price || ''}
                                onChange={(e) => handleVariantChange(activeVariant, 'unit_price', e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium admin-text">Precio Total</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="number"
                                step="0.01"
                                value={currentVariant.total_price || ''}
                                onChange={(e) => handleVariantChange(activeVariant, 'total_price', e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium admin-text">Moneda</label>
                        <select
                            value={currentVariant.currency || 'MXN'}
                            onChange={(e) => handleVariantChange(activeVariant, 'currency', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value="MXN">MXN (Pesos Mexicanos)</option>
                            <option value="USD">USD (Dólares)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium admin-text">Precio Original (Texto)</label>
                        <input
                            type="text"
                            value={currentVariant.price_raw || ''}
                            onChange={(e) => handleVariantChange(activeVariant, 'price_raw', e.target.value || null)}
                            placeholder="Ej: $50.00 MXN"
                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>

                {/* Ofertas */}
                <div className="border-t admin-border pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Tag className="text-primary-600" size={20} />
                            <h4 className="font-medium admin-text">Oferta / Descuento</h4>
                        </div>
                        {!currentVariant.offer ? (
                            <button
                                type="button"
                                onClick={() => handleAddOffer(activeVariant)}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                + Agregar Oferta
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleRemoveOffer(activeVariant)}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Quitar Oferta
                            </button>
                        )}
                    </div>

                    {currentVariant.offer && (
                        <div className="space-y-4 admin-bg rounded-lg p-4 border admin-border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium admin-text">Tipo de Oferta</label>
                                    <select
                                        value={currentVariant.offer.type || ''}
                                        onChange={(e) => handleOfferChange(activeVariant, 'type', e.target.value || null)}
                                        className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                    >
                                        <option value="">Sin tipo</option>
                                        <option value="percent">Porcentaje de Descuento</option>
                                        <option value="threshold">Por Cantidad Mínima</option>
                                        <option value="other">Otra Promoción</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium admin-text">Etiqueta</label>
                                    <input
                                        type="text"
                                        value={currentVariant.offer.label || ''}
                                        onChange={(e) => handleOfferChange(activeVariant, 'label', e.target.value || null)}
                                        placeholder="Ej: ¡Oferta especial!"
                                        className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                            </div>

                            {(currentVariant.offer.type === 'percent' || currentVariant.offer.type === 'threshold') && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentVariant.offer.type === 'percent' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium admin-text">Porcentaje de Descuento</label>
                                            <div className="relative">
                                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={currentVariant.offer.discount_percent || ''}
                                                    onChange={(e) => handleOfferChange(activeVariant, 'discount_percent', e.target.value ? parseFloat(e.target.value) : null)}
                                                    placeholder="10"
                                                    className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium admin-text">Cantidad Mínima</label>
                                        <input
                                            type="number"
                                            value={currentVariant.offer.min_quantity || ''}
                                            onChange={(e) => handleOfferChange(activeVariant, 'min_quantity', e.target.value ? parseInt(e.target.value) : null)}
                                            placeholder="2"
                                            className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium admin-text">Texto Original de la Oferta</label>
                                <input
                                    type="text"
                                    value={currentVariant.offer.raw || ''}
                                    onChange={(e) => handleOfferChange(activeVariant, 'raw', e.target.value || null)}
                                    placeholder="Ej: 2x1, 50% de descuento"
                                    className="w-full px-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Botón eliminar variante */}
                {decodedVariants.length > 1 && (
                    <div className="border-t admin-border pt-4">
                        <button
                            type="button"
                            onClick={() => handleRemoveVariant(activeVariant)}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                            Eliminar esta variante
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
