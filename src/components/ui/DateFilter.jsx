import React from 'react';

export default function DateFilter({ selectedDateRange, onChange }) {
    const options = [
        { label: 'Cualquier fecha', value: 'all' },
        { label: 'Últimas 24 horas', value: '24h' },
        { label: 'Última semana', value: '7d' },
        { label: 'Último mes', value: '30d' },
    ];

    return (
        <div>
            <h3 className="font-semibold text-sm mb-3 text-text-main uppercase tracking-wider">Fecha de Publicación</h3>
            <div className="space-y-2">
                {options.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="radio"
                            name="dateFilter"
                            value={option.value}
                            checked={selectedDateRange === option.value}
                            onChange={() => onChange(option.value)}
                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className={`text-sm ${selectedDateRange === option.value ? 'text-text-main font-medium' : 'text-text-secondary group-hover:text-text-main'}`}>
                            {option.label}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}
