'use client';

import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';

// Paleta de colores premium y moderna
const COLORS = [
    '#6366f1', // Indigo 500
    '#10b981', // Emerald 500
    '#f59e0b', // Amber 500
    '#ec4899', // Pink 500
    '#8b5cf6', // Violet 500
    '#3b82f6', // Blue 500
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl p-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function ChartWidget({ title, data, type = 'bar', dataKey = 'value', nameKey = 'name' }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col items-center justify-center h-[400px]">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs">
                    No hay datos suficientes para mostrar esta gráfica en este momento.
                </p>
            </div>
        );
    }

    const renderChart = () => {
        switch (type) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey={dataKey}
                                nameKey={nameKey}
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        className="hover:opacity-80 transition-opacity duration-300"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-1">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'bar':
            default:
                return (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
                            <XAxis
                                dataKey={nameKey}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar
                                dataKey={dataKey}
                                fill="#6366f1"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                                animationDuration={1500}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <div className="bg-surface shadow rounded-2xl shadow-sm border border-gray-900/20   p-8 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold   tracking-tight">
                    {title}
                </h3>
            </div>
            {renderChart()}
        </div>
    );
}
