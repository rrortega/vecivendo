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
    Megaphone,
    Archive,
    Filter,
    Calendar
} from 'lucide-react';

import KPICard from '@/components/console/dashboard/KPICard';
import KPISection from '@/components/console/dashboard/KPISection';
import ChartWidget from '@/components/console/dashboard/ChartWidget';
import CategoryFilterModal from '@/components/console/dashboard/CategoryFilterModal';
import { useDashboardKPIs } from '@/hooks/useDashboardKPIs';
import { useEffect } from 'react';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;

export default function DashboardPage() {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [residentialId, setResidentialId] = useState(null);
    const [dateFilter, setDateFilter] = useState('30days');
    const [residentials, setResidentials] = useState([]);

    // New Filter States
    const [selectedCountry, setSelectedCountry] = useState('all');
    const [selectedState, setSelectedState] = useState('all');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Filter Logic derived from selections
    const derivedResidentialIds = (() => {
        // 1. If specific residential is selected, use only that.
        if (residentialId) return [residentialId];

        // 2. If filtering by state, get all residentials in that state.
        if (selectedState !== 'all') {
            return residentials
                .filter(r => r.provincia_estado === selectedState)
                .map(r => r.$id);
        }

        // 3. If filtering by country, get all residentials in that country.
        if (selectedCountry !== 'all') {
            return residentials
                .filter(r => r.country === selectedCountry)
                .map(r => r.$id);
        }

        // 4. No location filter -> return null (meaning all) or empty array?
        // Hook logic: if (residentialIds && residentialIds.length > 0) -> filter.
        // So passing null or [] means "All".
        return null;
    })();

    const { kpis, loading, error } = useDashboardKPIs(
        startDate || new Date(),
        endDate || new Date(),
        derivedResidentialIds,
        selectedCategories
    );

    // Cargar residenciales
    useEffect(() => {
        async function fetchResidentials() {
            try {
                // Using BaaS instead of direct Appwrite client
                const baas = (await import('@/lib/baas')).default;

                const response = await baas.get(
                    `databases/${DATABASE_ID}/collections/residenciales/documents`
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
            case 'thisYear':
                start = new Date(now.getFullYear(), 0, 1);
                end = now;
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

    // Derived Lists for Filters
    const uniqueCountries = [...new Set(residentials.map(r => r.country).filter(Boolean))].sort();

    const availableStates = residentials
        .filter(r => selectedCountry === 'all' || r.country === selectedCountry)
        .map(r => r.provincia_estado)
        .filter(Boolean);
    const uniqueStates = [...new Set(availableStates)].sort();

    const filteredResidentials = residentials.filter(r => {
        const matchCountry = selectedCountry === 'all' || r.country === selectedCountry;
        const matchState = selectedState === 'all' || r.provincia_estado === selectedState;
        return matchCountry && matchState;
    });

    const handleCountryChange = (val) => {
        setSelectedCountry(val);
        setSelectedState('all');
        setResidentialId(null);
    };

    const handleStateChange = (val) => {
        setSelectedState(val);
        setResidentialId(null);
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
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Tablero de Control
                    </h1>
                    <div className="flex bg-surface rounded-lg p-1  dark:border-gray-700 overflow-x-auto">
                        {[
                            { id: '7days', label: '7 Días' },
                            { id: '30days', label: '30 Días' },
                            { id: 'thisMonth', label: 'Mes Actual' },
                            { id: 'lastMonth', label: 'Mes Pasado' },
                            { id: 'thisYear', label: 'Año Actual' }
                        ].map((period) => (
                            <button
                                key={period.id}
                                onClick={() => handleDateFilterChange(period.id)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${dateFilter === period.id
                                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                                    }`}
                            >
                                {period.label}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    Métricas en tiempo real y análisis del sistema
                </p>
            </div>

            {/* Filters */}
            {/* Filters */}
            <div className="bg-surface rounded-2xl p-6 mb-8 shadow-sm border border-gray-900/20">
                <div className="grid grid-cols-12 gap-4">
                    {/* Country Filter - Col 2 */}
                    <div className="col-span-12 md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            País
                        </label>
                        <select
                            value={selectedCountry}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">Todos</option>
                            {uniqueCountries.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* State Filter - Col 3 */}
                    <div className="col-span-12 md:col-span-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Provincia
                        </label>
                        <select
                            value={selectedState}
                            onChange={(e) => handleStateChange(e.target.value)}
                            disabled={selectedCountry === 'all' && uniqueStates.length > 10}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                        >
                            <option value="all">Todos</option>
                            {uniqueStates.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Residential Filter - Col 5 */}
                    <div className="col-span-12 md:col-span-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Residencial
                        </label>
                        <select
                            value={residentialId || "all"}
                            onChange={(e) => handleResidentialChange(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">Todos los residenciales ({filteredResidentials.length})</option>
                            {filteredResidentials.map((res) => (
                                <option key={res.$id} value={res.$id}>
                                    {res.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category Filter Button - Col 2 */}
                    <div className="col-span-12 md:col-span-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Categorías
                        </label>
                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-sm font-medium whitespace-nowrap overflow-hidden ${selectedCategories.length > 0
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Filter size={16} />
                                <span>Filtros</span>
                            </div>
                            {selectedCategories.length > 0 && (
                                <span className="bg-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold ml-1">
                                    {selectedCategories.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <CategoryFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                selectedCategories={selectedCategories}
                onApply={setSelectedCategories}
            />

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
                    <KPISection title="Anuncios" gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                        <KPICard
                            title="Anuncios Activos"
                            value={kpis.ads.totalActive}
                            previousValue={kpis.ads.totalActivePrevious}
                            change={kpis.ads.totalActiveChange}
                            icon={Package}
                        />
                        <KPICard
                            title="Anuncios Inactivos"
                            value={kpis.ads.totalInactive}
                            previousValue={kpis.ads.totalInactivePrevious}
                            change={kpis.ads.totalInactiveChange}
                            icon={Archive}
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
                                type="pie"
                                variant="rose"
                            />
                        </div>
                    )}

                    {/* Sección de Engagement */}
                    <KPISection title="Engagement" gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
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
                    <KPISection title="Pedidos" gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
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
                    <KPISection title="Usuarios" gridClassName="grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
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
                    <KPISection title="Publicidad Pagada" >
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
                    <KPISection title="Calidad" gridClassName="grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
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
