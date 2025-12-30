import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { tablesDB, dbId } from '@/lib/appwrite-server';
import {
    calculateAdKPIs,
    calculateOrderKPIs,
    calculateQualityKPIs,
    calculateEngagementKPIs,
    calculateSystemHealth,
    calculateUserKPIs,
    calculatePaidAdKPIs,
    getPreviousPeriod
} from '@/lib/kpisCalculations';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const residentialIdsParam = searchParams.get('residentialIds');
        const categoriesParam = searchParams.get('categories');
        const section = searchParams.get('section') || 'all';

        if (!startDateParam || !endDateParam) {
            return NextResponse.json(
                { error: 'Parameters startDate and endDate are required' },
                { status: 400 }
            );
        }

        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);
        const residentialIds = residentialIdsParam ? residentialIdsParam.split(',') : null;
        const categories = categoriesParam ? categoriesParam.split(',') : [];

        // Calculate previous period
        const { previousStart, previousEnd } = getPreviousPeriod(startDate, endDate);

        // Limit for batches
        const LIMIT = 5000;

        // Base Queries
        const getResidentialFilters = (queries = []) => {
            if (residentialIds && residentialIds.length > 0) {
                queries.push(Query.equal('residencial', residentialIds));
            }
            return queries;
        };

        const filterDate = (docs, start, end, field = '$createdAt') => {
            const s = new Date(start).getTime();
            const e = new Date(end).getTime();
            return docs.filter(d => {
                const t = new Date(d[field]).getTime();
                return t >= s && t <= e;
            });
        };

        // Prepare response object
        const result = {};

        // SECTION: ADS
        if (section === 'ads' || section === 'all' || section === 'users') {
            const adQueries = [Query.limit(LIMIT)];
            getResidentialFilters(adQueries);
            if (categories && categories.length > 0) {
                adQueries.push(Query.equal('categoria', categories));
            }

            const [adsRes, categoriesRes] = await Promise.all([
                tablesDB.listRows({ databaseId: dbId, tableId: 'anuncios', queries: adQueries }),
                tablesDB.listRows({ databaseId: dbId, tableId: 'categorias', queries: [Query.limit(100)] })
            ]);

            const categoriesMap = (categoriesRes?.rows || []).reduce((acc, cat) => {
                acc[cat.$id] = cat.nombre;
                return acc;
            }, {});

            // Filtrar anuncios del período actual y anterior basado en $createdAt
            const allAds = adsRes.rows || [];
            const currentPeriodAds = filterDate(allAds, startDate, endDate, '$createdAt');
            const previousPeriodAds = filterDate(allAds, previousStart, previousEnd, '$createdAt');

            if (section === 'ads' || section === 'all') {
                result.ads = calculateAdKPIs(allAds, currentPeriodAds, previousPeriodAds, categoriesMap);
            }
            if (section === 'users' || section === 'all') {
                result.users = calculateUserKPIs(allAds, allAds);
            }
        }

        // SECTION: ORDERS
        if (section === 'orders' || section === 'all' || section === 'paidAds') {
            const currentOrdersQuery = [
                Query.limit(LIMIT),
                Query.greaterThanEqual('$createdAt', startDate.toISOString()),
                Query.lessThanEqual('$createdAt', endDate.toISOString())
            ];
            const previousOrdersQuery = [
                Query.limit(LIMIT),
                Query.greaterThanEqual('$createdAt', previousStart.toISOString()),
                Query.lessThanEqual('$createdAt', previousEnd.toISOString())
            ];

            const [currentOrders, previousOrders] = await Promise.all([
                tablesDB.listRows({ databaseId: dbId, tableId: 'pedidos', queries: currentOrdersQuery }),
                tablesDB.listRows({ databaseId: dbId, tableId: 'pedidos', queries: previousOrdersQuery })
            ]);

            if (section === 'orders' || section === 'all') {
                result.orders = calculateOrderKPIs(currentOrders.rows, previousOrders.rows);
            }

            // We need these for paidAds later if section is 'all' or 'paidAds'
            result._currentOrders = currentOrders.rows;
            result._previousOrders = previousOrders.rows;
        }

        // SECTION: ENGAGEMENT
        if (section === 'engagement' || section === 'all' || section === 'paidAds') {
            const currentLogsQuery = [
                Query.limit(LIMIT),
                Query.greaterThanEqual('timestamp', startDate.toISOString()),
                Query.lessThanEqual('timestamp', endDate.toISOString())
            ];
            const previousLogsQuery = [
                Query.limit(LIMIT),
                Query.greaterThanEqual('timestamp', previousStart.toISOString()),
                Query.lessThanEqual('timestamp', previousEnd.toISOString())
            ];

            let currentLogs = { rows: [] };
            let previousLogs = { rows: [] };

            try {
                [currentLogs, previousLogs] = await Promise.all([
                    tablesDB.listRows({ databaseId: dbId, tableId: 'logs', queries: currentLogsQuery }),
                    tablesDB.listRows({ databaseId: dbId, tableId: 'logs', queries: previousLogsQuery })
                ]);
            } catch (logError) {
                console.warn('⚠️ [BFF] Error al consultar la tabla de logs:', logError.message);
                // Fallback a [] si la tabla no existe o falla la consulta
            }

            if (section === 'engagement' || section === 'all') {
                result.engagement = calculateEngagementKPIs(currentLogs.rows, previousLogs.rows);
                result.systemHealth = calculateSystemHealth(currentLogs.rows);
            }

            // Keep for paidAds
            result._currentLogs = currentLogs.rows;
            result._previousLogs = previousLogs.rows;
        }

        // SECTION: PAID ADS
        if (section === 'paidAds' || section === 'all') {
            const currentPaidAds = await tablesDB.listRows({ databaseId: dbId, tableId: 'anuncios_pago', queries: [Query.limit(LIMIT)] });

            // If we don't have logs/orders from previous conditional blocks, fetch them (only happens if section is 'paidAds' specifically)
            let logs = result._currentLogs;
            let prevLogs = result._previousLogs;
            let orders = result._currentOrders;
            let prevOrders = result._previousOrders;

            if (!logs || !orders) {
                // This is a bit redundant but safe if requested specifically
                try {
                    const [l, pl, o, po] = await Promise.all([
                        tablesDB.listRows({ databaseId: dbId, tableId: 'logs', queries: [Query.limit(LIMIT), Query.greaterThanEqual('timestamp', startDate.toISOString()), Query.lessThanEqual('timestamp', endDate.toISOString())] }),
                        tablesDB.listRows({ databaseId: dbId, tableId: 'logs', queries: [Query.limit(LIMIT), Query.greaterThanEqual('timestamp', previousStart.toISOString()), Query.lessThanEqual('timestamp', previousEnd.toISOString())] }),
                        tablesDB.listRows({ databaseId: dbId, tableId: 'pedidos', queries: [Query.limit(LIMIT), Query.greaterThanEqual('$createdAt', startDate.toISOString()), Query.lessThanEqual('$createdAt', endDate.toISOString())] }),
                        tablesDB.listRows({ databaseId: dbId, tableId: 'pedidos', queries: [Query.limit(LIMIT), Query.greaterThanEqual('$createdAt', previousStart.toISOString()), Query.lessThanEqual('$createdAt', previousEnd.toISOString())] })
                    ]);
                    logs = l.rows; prevLogs = pl.rows; orders = o.rows; prevOrders = po.rows;
                } catch (fetchError) {
                    console.warn('⚠️ [BFF] Error al obtener datos adicionales para PaidAds:', fetchError.message);
                    logs = logs || []; prevLogs = prevLogs || []; orders = orders || []; prevOrders = prevOrders || [];
                }
            }

            result.paidAds = calculatePaidAdKPIs(currentPaidAds.rows, logs, orders, currentPaidAds.rows, prevLogs, prevOrders);
        }

        // SECTION: QUALITY
        if (section === 'quality' || section === 'all') {
            const reviewsRes = await tablesDB.listRows({ databaseId: dbId, tableId: 'reviews', queries: [Query.limit(LIMIT)] });
            const validCurrentReviews = filterDate(reviewsRes.rows, startDate, endDate);
            const validPreviousReviews = filterDate(reviewsRes.rows, previousStart, previousEnd);
            result.quality = calculateQualityKPIs(validCurrentReviews, validPreviousReviews);
        }

        // Clean up temporary internal data
        delete result._currentLogs;
        delete result._previousLogs;
        delete result._currentOrders;
        delete result._previousOrders;

        return NextResponse.json(result);

    } catch (error) {
        console.error('BFF /dashboard/stats Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats', details: error.message },
            { status: 500 }
        );
    }
}
