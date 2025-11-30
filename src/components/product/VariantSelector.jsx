import React from "react";

export const VariantSelector = ({ variants, selected, onSelect }) => {
    return (
        <div className="my-6">
            <h3 className="text-sm font-medium text-text-secondary mb-3">Seleccionar Variante</h3>
            <div className="flex flex-wrap gap-3">
                {variants.map((variant) => (
                    <button
                        key={variant}
                        onClick={() => onSelect(variant)}
                        className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${selected === variant
                            ? "border-primary text-primary bg-primary/5"
                            : "border-border text-text-secondary hover:border-gray-300"
                            }`}
                    >
                        {variant}
                    </button>
                ))}
            </div>
        </div>
    );
};
