import React from 'react';

export default function PriceRangeFilter({ minPrice, maxPrice, onChange }) {
    const handleMinChange = (e) => {
        const val = e.target.value === '' ? '' : Number(e.target.value);
        onChange({ min: val, max: maxPrice });
    };

    const handleMaxChange = (e) => {
        const val = e.target.value === '' ? '' : Number(e.target.value);
        onChange({ min: minPrice, max: val });
    };

    return (
        <div>
            <h3 className="font-semibold text-sm mb-3 text-text-main uppercase tracking-wider">Precio</h3>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">$</span>
                    <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={handleMinChange}
                        className="w-full pl-6 pr-2 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <span className="text-text-secondary">-</span>
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">$</span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={handleMaxChange}
                        className="w-full pl-6 pr-2 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>
        </div>
    );
}
