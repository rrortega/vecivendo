'use client';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/kpisCalculations';

export default function KPICard({
    title,
    value,
    previousValue,
    change,
    icon: Icon,
    format = 'number', // 'number', 'currency', 'percentage'
    currency = 'USD'
}) {
    const getTrendIcon = () => {
        if (!change) return <Minus className="w-3 h-3" />;

        switch (change.trend) {
            case 'up':
                return <ArrowUp className="w-3 h-3" />;
            case 'down':
                return <ArrowDown className="w-3 h-3" />;
            default:
                return <Minus className="w-3 h-3" />;
        }
    };

    const getTrendColor = () => {
        if (!change) return 'bg-surface text-gray-400';

        switch (change.trend) {
            case 'up':
                return 'bg-green-900/20 text-green-400';
            case 'down':
                return 'bg-red-900/20 text-red-400';
            default:
                return 'g-gray-700 text-gray-400';
        }
    };

    const formatValue = (val) => {
        if (val === null || val === undefined) return '-';

        switch (format) {
            case 'currency':
                return formatCurrency(val, currency);
            case 'percentage':
                return formatPercentage(val);
            case 'number':
            default:
                return formatNumber(val);
        }
    };

    return (
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-900/20 p-6 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                    {Icon && <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                </div>
                {change && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span>{formatPercentage(change.percentage, 1)}</span>
                    </div>
                )}
            </div>

            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {title}
                </p>
                <h3 className="text-3xl font-bold  tracking-tight">
                    {formatValue(value)}
                </h3>
            </div>
        </div>
    );
}
