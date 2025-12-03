'use client';

import { useState } from 'react';

const DATE_FILTERS = {
    TODAY: 'today',
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    LAST_90_DAYS: 'last_90_days',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    CUSTOM: 'custom'
};

const FILTER_LABELS = {
    [DATE_FILTERS.TODAY]: 'Hoy',
    [DATE_FILTERS.LAST_7_DAYS]: 'Últimos 7 días',
    [DATE_FILTERS.LAST_30_DAYS]: 'Últimos 30 días',
    [DATE_FILTERS.LAST_90_DAYS]: 'Últimos 90 días',
    [DATE_FILTERS.THIS_MONTH]: 'Este mes',
    [DATE_FILTERS.LAST_MONTH]: 'Mes anterior',
    [DATE_FILTERS.CUSTOM]: 'Personalizado'
};

function getDateRange(filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
        case DATE_FILTERS.TODAY:
            return {
                start: today,
                end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
            };

        case DATE_FILTERS.LAST_7_DAYS:
            return {
                start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
                end: now
            };

        case DATE_FILTERS.LAST_30_DAYS:
            return {
                start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: now
            };

        case DATE_FILTERS.LAST_90_DAYS:
            return {
                start: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
                end: now
            };

        case DATE_FILTERS.THIS_MONTH:
            return {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: now
            };

        case DATE_FILTERS.LAST_MONTH: {
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            return {
                start: lastMonthStart,
                end: lastMonthEnd
            };
        }

        default:
            return {
                start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: now
            };
    }
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function DateRangeFilter({ onDateChange }) {
    const [activeFilter, setActiveFilter] = useState(DATE_FILTERS.LAST_30_DAYS);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const handleQuickFilter = (filter) => {
        setActiveFilter(filter);
        const range = getDateRange(filter);
        onDateChange(range.start, range.end);
    };

    const handleCustomDateChange = () => {
        if (customStart && customEnd) {
            const start = new Date(customStart);
            const end = new Date(customEnd);
            end.setHours(23, 59, 59, 999);

            if (start <= end) {
                setActiveFilter(DATE_FILTERS.CUSTOM);
                onDateChange(start, end);
            }
        }
    };

    // Inicializar con el filtro por defecto
    useState(() => {
        const range = getDateRange(DATE_FILTERS.LAST_30_DAYS);
        onDateChange(range.start, range.end);
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Filtrar por fecha
            </h3>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(FILTER_LABELS).map(([key, label]) => {
                    if (key === DATE_FILTERS.CUSTOM) return null;

                    return (
                        <button
                            key={key}
                            onClick={() => handleQuickFilter(key)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeFilter === key
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Rango personalizado */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rango personalizado
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Fecha inicio
                        </label>
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Fecha fin
                        </label>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleCustomDateChange}
                            disabled={!customStart || !customEnd}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
