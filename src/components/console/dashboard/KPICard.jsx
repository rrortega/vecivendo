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
        if (!change) return <Minus className="w-4 h-4" />;

        switch (change.trend) {
            case 'up':
                return <ArrowUp className="w-4 h-4" />;
            case 'down':
                return <ArrowDown className="w-4 h-4" />;
            default:
                return <Minus className="w-4 h-4" />;
        }
    };

    const getTrendColor = () => {
        if (!change) return 'text-gray-500';

        switch (change.trend) {
            case 'up':
                return 'text-green-600 dark:text-green-400';
            case 'down':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-gray-500 dark:text-gray-400';
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow dark:border dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {title}
                    </p>
                </div>
                {Icon && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                )}
            </div>

            <div className="mb-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatValue(value)}
                </p>
            </div>

            {change && (
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span className="text-sm font-medium">
                            {formatPercentage(change.percentage, 1)}
                        </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        vs período anterior
                    </span>
                </div>
            )}
        </div>
    );
}
