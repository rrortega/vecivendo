import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export default function Sorter({ sortOption, onChange }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary hidden sm:inline">Ordenar por:</span>
            <div className="relative">
                <select
                    value={sortOption}
                    onChange={(e) => onChange(e.target.value)}
                    className="appearance-none bg-white border border-border text-text-main text-sm rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                    <option value="newest">Más recientes</option>
                    <option value="price_asc">Precio: Menor a Mayor</option>
                    <option value="price_desc">Precio: Mayor a Menor</option>
                </select>
                <ArrowUpDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            </div>
        </div>
    );
}
