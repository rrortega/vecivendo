'use client';

import { useState } from 'react';
import {
    BarChart3,
    Eye,
    ShoppingCart,
    Users,
    DollarSign,
    Star,
    TrendingUp,
    Package,
    MousePointerClick,
    Receipt,
    UserPlus,
    Megaphone
} from 'lucide-react';

import KPICard from '@/components/console/dashboard/KPICard';
import KPISection from '@/components/console/dashboard/KPISection';
import ChartWidget from '@/components/console/dashboard/ChartWidget';
import { useDashboardKPIs } from '@/hooks/useDashboardKPIs';
import { databases } from '@/lib/appwrite';
import { useEffect } from 'react';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;

export default function DashboardPage() {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [residentialId, setResidentialId] = useState(null);
    const [dateFilter, setDateFilter] = useState('30days');
    const [residentials, setResidentials] = useState([]);

    const { kpis, loading, error } = useDashboardKPIs(
        startDate || new Date(),
        endDate || new Date(),
        residentialId
    );

    // Cargar residenciales
    useEffect(() => {
        async function fetchResidentials() {
            try {
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    'residenciales'
                );
                setResidentials(response.documents);
            } catch (error) {
                console.error('Error loading residentials:', error);
            }
        }
        fetchResidentials();
    }, []);

    // Inicializar fechas al montar
    useEffect(() => {
        handleDateFilterChange('30days');
    }, []);

    const handleDateFilterChange = (filter) => {
        setDateFilter(filter);
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (filter) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = now;
                break;
            case '7days':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                end = now;
                break;
            case '30days':
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                end = now;
                break;
            case '90days':
                start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                end = now;
                break;
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = now;
                break;
            case 'lastMonth':
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                start = lastMonth;
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            default:
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                end = now;
        }

        setStartDate(start);
        setEndDate(end);
    };

    const handleResidentialChange = (value) => {
        setResidentialId(value === 'all' ? null : value);
    };

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200">
                        Error al cargar los KPIs: {error}
                    </p>
                </div>
            </div>
        );
    }

    // Preparar datos para gráficos
    const categoryChartData = kpis?.ads?.adsByCategory
        ? Object.entries(kpis.ads.adsByCategory).map(([name, value]) => ({ name, value }))
        : [];

    const deviceChartData = kpis?.engagement?.deviceBreakdown
        ? Object.entries(kpis.engagement.deviceBreakdown).map(([name, value]) => ({ name, value }))
        : [];

    const statusChartData = kpis?.orders?.ordersByStatus
        ? Object.entries(kpis.orders.ordersByStatus).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
            value
        }))
        : [];

    const ratingChartData = kpis?.quality?.ratingDistribution
        ? Object.entries(kpis.quality.ratingDistribution).map(([name, value]) => ({
            name: `${name} estrellas`,
            value
        }))
        : [];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Tablero de Control
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Métricas en tiempo real del sistema
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 dark:border dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date Range Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Período de Tiempo
                        </label>
                        <select
                            value={dateFilter}
                            onChange={(e) => handleDateFilterChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="today">Hoy</option>
                            <option value="7days">Últimos 7 días</option>
                            <option value="30days">Últimos 30 días</option>
                            <option value="90days">Últimos 90 días</option>
                            <option value="thisMonth">Este mes</option>
                            <option value="lastMonth">Mes anterior</option>
                        </select>
                    </div>

                    {/* Residential Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Residencial
                        </label>
                        <select
                            value={residentialId || "all"}
                            onChange={(e) => handleResidentialChange(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="all">Todos los residenciales</option>
                            {residentials.map((res) => (
                                <option key={res.$id} value={res.$id}>
                                    {res.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && !kpis && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* KPIs Sections */}
            {kpis && (
                <>
                    {/* Sección de Anuncios */}
                    <KPISection title="Anuncios" icon={Package}>
                        <KPICard
                            title="Anuncios Activos"
                            value={kpis.ads.totalActive}
                            previousValue={kpis.ads.totalActivePrevious}
                            change={kpis.ads.totalActiveChange}
                            icon={Package}
                        />
                        <KPICard
                            title="Tasa de Crecimiento"
                            value={kpis.ads.growthRate.percentage}
                            change={kpis.ads.growthRate}
                            icon={TrendingUp}
                            format="percentage"
                        />
                        <KPICard
                            title="Próximos a Vencer"
                            value={kpis.ads.expiringAds}
                            icon={Package}
                        />
                    </KPISection>

                    {/* Gráfico de Anuncios por Categoría */}
                    {categoryChartData.length > 0 && (
                        <div className="mb-8">
                            <ChartWidget
                                title="Anuncios por Categoría"
                                data={categoryChartData}
                                type="bar"
                            />
                        </div>
                    )}

                    {/* Sección de Engagement */}
                    <KPISection title="Engagement" icon={Eye}>
                        <KPICard
                            title="Total de Visualizaciones"
                            value={kpis.engagement.totalViews}
                            previousValue={kpis.engagement.totalViewsPrevious}
                            change={kpis.engagement.totalViewsChange}
                            icon={Eye}
                        />
                        <KPICard
                            title="Visualizaciones Únicas"
                            value={kpis.engagement.uniqueViews}
                            previousValue={kpis.engagement.uniqueViewsPrevious}
                            change={kpis.engagement.uniqueViewsChange}
                            icon={Users}
                        />
                        <KPICard
                            title="Total de Clics"
                            value={kpis.engagement.totalClicks}
                            previousValue={kpis.engagement.totalClicksPrevious}
                            change={kpis.engagement.totalClicksChange}
                            icon={MousePointerClick}
                        />
                        <KPICard
                            title="CTR (Tasa de Clics)"
                            value={kpis.engagement.ctr}
                            previousValue={kpis.engagement.ctrPrevious}
                            change={kpis.engagement.ctrChange}
                            icon={TrendingUp}
                            format="percentage"
                        />
                    </KPISection>

                    {/* Gráfico de Engagement por Dispositivo */}
                    {deviceChartData.length > 0 && (
                        <div className="mb-8">
                            <ChartWidget
                                title="Engagement por Dispositivo"
                                data={deviceChartData}
                                type="pie"
                            />
                        </div>
                    )}

                    {/* Sección de Pedidos */}
                    <KPISection title="Pedidos" icon={ShoppingCart}>
                        <KPICard
                            title="Total de Pedidos"
                            value={kpis.orders.totalOrders}
                            previousValue={kpis.orders.totalOrdersPrevious}
                            change={kpis.orders.totalOrdersChange}
                            icon={ShoppingCart}
                        />
                        <KPICard
                            title="Valor Total"
                            value={kpis.orders.totalValue}
                            previousValue={kpis.orders.totalValuePrevious}
                            change={kpis.orders.totalValueChange}
                            icon={DollarSign}
                            format="currency"
                        />
                        <KPICard
                            title="Ticket Promedio"
                            value={kpis.orders.avgTicket}
                            previousValue={kpis.orders.avgTicketPrevious}
                            change={kpis.orders.avgTicketChange}
                            icon={Receipt}
                            format="currency"
                        />
                        <KPICard
                            title="Tasa de Conversión"
                            value={kpis.orders.conversionRate}
                            previousValue={kpis.orders.previousConversionRate}
                            icon={TrendingUp}
                            format="percentage"
                        />
                    </KPISection>

                    {/* Gráfico de Pedidos por Estado */}
                    {statusChartData.length > 0 && (
                        <div className="mb-8">
                            <ChartWidget
                                title="Pedidos por Estado"
                                data={statusChartData}
                                type="bar"
                            />
                        </div>
                    )}

                    {/* Sección de Usuarios */}
                    <KPISection title="Usuarios" icon={Users}>
                        <KPICard
                            title="Anunciantes Activos"
                            value={kpis.users.activeAdvertisers}
                            previousValue={kpis.users.activeAdvertisersPrevious}
                            change={kpis.users.activeAdvertisersChange}
                            icon={Users}
                        />
                        <KPICard
                            title="Nuevos Anunciantes"
                            value={kpis.users.newAdvertisers}
                            icon={UserPlus}
                        />
                    </KPISection>

                    {/* Sección de Publicidad Pagada */}
                    <KPISection title="Publicidad Pagada" icon={Megaphone}>
                        <KPICard
                            title="Anuncios Pagados Activos"
                            value={kpis.paidAds.activePaidAds}
                            previousValue={kpis.paidAds.activePaidAdsPrevious}
                            change={kpis.paidAds.activePaidAdsChange}
                            icon={Megaphone}
                        />
                        <KPICard
                            title="Impresiones"
                            value={kpis.paidAds.impressions}
                            previousValue={kpis.paidAds.impressionsPrevious}
                            change={kpis.paidAds.impressionsChange}
                            icon={Eye}
                        />
                        <KPICard
                            title="CTR de Publicidad"
                            value={kpis.paidAds.ctr}
                            previousValue={kpis.paidAds.ctrPrevious}
                            change={kpis.paidAds.ctrChange}
                            icon={TrendingUp}
                            format="percentage"
                        />
                    </KPISection>

                    {/* Sección de Calidad */}
                    <KPISection title="Calidad" icon={Star}>
                        <KPICard
                            title="Total de Reseñas"
                            value={kpis.quality.totalReviews}
                            previousValue={kpis.quality.totalReviewsPrevious}
                            change={kpis.quality.totalReviewsChange}
                            icon={Star}
                        />
                        <KPICard
                            title="Calificación Promedio"
                            value={kpis.quality.avgRating}
                            previousValue={kpis.quality.avgRatingPrevious}
                            change={kpis.quality.avgRatingChange}
                            icon={Star}
                        />
                    </KPISection>

                    {/* Gráfico de Distribución de Calificaciones */}
                    {ratingChartData.length > 0 && (
                        <div className="mb-8">
                            <ChartWidget
                                title="Distribución de Calificaciones"
                                data={ratingChartData}
                                type="bar"
                            />
                        </div>
                    )}
                </>
            )}

            {/* Indicador de actualización en tiempo real */}
            {kpis && (
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Actualización en tiempo real activada
                    </p>
                </div>
            )}
        </div>
    );
}
