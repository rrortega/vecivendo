'use client';

import { useState, useEffect, useCallback } from 'react';
import { databases, client } from '@/lib/appwrite';
import { Query } from 'appwrite';
import {
    filterByDateRange,
    getPreviousPeriod,
    calculateAdKPIs,
    calculateEngagementKPIs,
    calculateOrderKPIs,
    calculateConversionRate,
    calculateUserKPIs,
    calculatePaidAdKPIs,
    calculateQualityKPIs
} from '@/lib/kpisCalculations';

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

export function useDashboardKPIs(startDate, endDate, residentialId = null) {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchKPIs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Calcular período anterior para comparaciones
            const { previousStart, previousEnd } = getPreviousPeriod(startDate, endDate);

            // Construir queries base
            const baseQueries = [Query.limit(5000)];
            const residentialQueries = residentialId
                ? [...baseQueries, Query.equal('residencial_id', residentialId)]
                : baseQueries;

            // Fetch paralelo de todas las colecciones
            const [
                anunciosResponse,
                logsResponse,
                pedidosResponse,
                paidAdsResponse,
                reviewsResponse
            ] = await Promise.all([
                databases.listDocuments(DB_ID, 'anuncios', residentialQueries),
                databases.listDocuments(DB_ID, 'logs', baseQueries),
                databases.listDocuments(DB_ID, 'pedidos', residentialQueries),
                databases.listDocuments(DB_ID, 'anuncios_pago', baseQueries).catch(() => ({ documents: [] })),
                databases.listDocuments(DB_ID, 'reviews', baseQueries).catch(() => ({ documents: [] }))
            ]);

            // Filtrar por rango de fechas
            const anuncios = filterByDateRange(anunciosResponse.documents, startDate, endDate);
            const previousAnuncios = filterByDateRange(anunciosResponse.documents, previousStart, previousEnd);

            const logs = filterByDateRange(logsResponse.documents, startDate, endDate, 'timestamp');
            const previousLogs = filterByDateRange(logsResponse.documents, previousStart, previousEnd, 'timestamp');

            const pedidos = filterByDateRange(pedidosResponse.documents, startDate, endDate);
            const previousPedidos = filterByDateRange(pedidosResponse.documents, previousStart, previousEnd);

            const paidAds = filterByDateRange(paidAdsResponse.documents, startDate, endDate);
            const previousPaidAds = filterByDateRange(paidAdsResponse.documents, previousStart, previousEnd);

            const reviews = filterByDateRange(reviewsResponse.documents, startDate, endDate);
            const previousReviews = filterByDateRange(reviewsResponse.documents, previousStart, previousEnd);

            // Filtrar logs de anuncios pagados
            const paidLogs = logs.filter(log => log.anuncioPagoId);
            const previousPaidLogs = previousLogs.filter(log => log.anuncioPagoId);

            // Calcular todos los KPIs
            const adKPIs = calculateAdKPIs(anuncios, previousAnuncios);
            const engagementKPIs = calculateEngagementKPIs(logs, previousLogs);
            const orderKPIs = calculateOrderKPIs(pedidos, previousPedidos);
            const userKPIs = calculateUserKPIs(anuncios, previousAnuncios);
            const paidAdKPIs = calculatePaidAdKPIs(paidAds, paidLogs, previousPaidAds, previousPaidLogs);
            const qualityKPIs = calculateQualityKPIs(reviews, previousReviews);

            // Calcular tasa de conversión
            const conversionRate = calculateConversionRate(orderKPIs.totalOrders, engagementKPIs.totalViews);
            const previousConversionRate = calculateConversionRate(
                orderKPIs.totalOrdersPrevious,
                engagementKPIs.totalViewsPrevious
            );

            setKpis({
                ads: adKPIs,
                engagement: engagementKPIs,
                orders: {
                    ...orderKPIs,
                    conversionRate,
                    previousConversionRate
                },
                users: userKPIs,
                paidAds: paidAdKPIs,
                quality: qualityKPIs,
                period: {
                    start: startDate,
                    end: endDate,
                    previousStart,
                    previousEnd
                }
            });

        } catch (err) {
            console.error('Error fetching KPIs:', err);
            setError(err.message || 'Error al cargar los KPIs');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, residentialId]);

    // Fetch inicial
    useEffect(() => {
        fetchKPIs();
    }, [fetchKPIs]);

    // Suscripción a Realtime para actualizaciones automáticas
    useEffect(() => {
        const unsubscribes = [];

        // Suscribirse a cambios en anuncios
        const unsubscribeAnuncios = client.subscribe(
            `databases.${DB_ID}.collections.anuncios.documents`,
            () => {
                console.log('Anuncios actualizados, recargando KPIs...');
                fetchKPIs();
            }
        );
        unsubscribes.push(unsubscribeAnuncios);

        // Suscribirse a cambios en logs
        const unsubscribeLogs = client.subscribe(
            `databases.${DB_ID}.collections.logs.documents`,
            () => {
                console.log('Logs actualizados, recargando KPIs...');
                fetchKPIs();
            }
        );
        unsubscribes.push(unsubscribeLogs);

        // Suscribirse a cambios en pedidos
        const unsubscribePedidos = client.subscribe(
            `databases.${DB_ID}.collections.pedidos.documents`,
            () => {
                console.log('Pedidos actualizados, recargando KPIs...');
                fetchKPIs();
            }
        );
        unsubscribes.push(unsubscribePedidos);

        // Suscribirse a cambios en anuncios pagados
        const unsubscribePaidAds = client.subscribe(
            `databases.${DB_ID}.collections.anuncios_pago.documents`,
            () => {
                console.log('Anuncios pagados actualizados, recargando KPIs...');
                fetchKPIs();
            }
        );
        unsubscribes.push(unsubscribePaidAds);

        // Suscribirse a cambios en reviews
        const unsubscribeReviews = client.subscribe(
            `databases.${DB_ID}.collections.reviews.documents`,
            () => {
                console.log('Reviews actualizadas, recargando KPIs...');
                fetchKPIs();
            }
        );
        unsubscribes.push(unsubscribeReviews);

        // Cleanup: desuscribirse al desmontar
        return () => {
            unsubscribes.forEach(unsub => {
                if (typeof unsub === 'function') {
                    unsub();
                }
            });
        };
    }, [fetchKPIs]);

    return {
        kpis,
        loading,
        error,
        refresh: fetchKPIs
    };
}
