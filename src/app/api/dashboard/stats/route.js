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
        // Helper to add residential filter
        const getResidentialFilters = (queries = []) => {
            if (residentialIds && residentialIds.length > 0) {
                // Use equal for multiple values (Appwrite supports array for equal)
                queries.push(Query.equal('residencial', residentialIds));
            }
            return queries;
        };

        // Queries for Ads (Current "Snapshot")
        const adQueries = [Query.limit(LIMIT)];
        getResidentialFilters(adQueries);

        if (categories && categories.length > 0) {
            // Filter by category ID using 'categoria' (singular usually for relationship)
            // Use spread operator if categories is an array, or pass the array directly for 'equal' which acts as 'in'
            adQueries.push(Query.equal('categoria', categories));
        }

        // Queries for Current Period
        const currentLogsQuery = [
            Query.limit(LIMIT),
            Query.greaterThanEqual('timestamp', startDate.toISOString()),
            Query.lessThanEqual('timestamp', endDate.toISOString())
        ];

        const currentOrdersQuery = [
            Query.limit(LIMIT),
            Query.greaterThanEqual('$createdAt', startDate.toISOString()),
            Query.lessThanEqual('$createdAt', endDate.toISOString())
        ];

        // Queries for Previous Period
        const previousLogsQuery = [
            Query.limit(LIMIT),
            Query.greaterThanEqual('timestamp', previousStart.toISOString()),
            Query.lessThanEqual('timestamp', previousEnd.toISOString())
        ];

        const previousOrdersQuery = [
            Query.limit(LIMIT),
            Query.greaterThanEqual('$createdAt', previousStart.toISOString()),
            Query.lessThanEqual('$createdAt', previousEnd.toISOString())
        ];

        // Parallel Fetching
        const [
            currentAds,
            currentLogs,
            currentOrders,
            currentReviews, // Assuming we filter later or fetch all
            currentPaidAds,
            currentCategoriesDocs,
            previousLogs,
            previousOrders,
            previousReviews
        ] = await Promise.all([
            // Current
            tablesDB.listRows({ databaseId: dbId, tableId: 'anuncios', queries: adQueries }),
            tablesDB.listRows({ databaseId: dbId, tableId: 'logs', queries: currentLogsQuery }),
            tablesDB.listRows({ databaseId: dbId, tableId: 'pedidos', queries: currentOrdersQuery }),
            tablesDB.listRows({ databaseId: dbId, tableId: 'reviews', queries: [Query.limit(LIMIT)] }),
            tablesDB.listRows({ databaseId: dbId, tableId: 'anuncios_pago', queries: [Query.limit(LIMIT)] }),
            tablesDB.listRows({ databaseId: dbId, tableId: 'categorias', queries: [Query.limit(100)] }),

            // Previous
            tablesDB.listRows({ databaseId: dbId, tableId: 'logs', queries: previousLogsQuery }),
            tablesDB.listRows({ databaseId: dbId, tableId: 'pedidos', queries: previousOrdersQuery }),
            tablesDB.listRows({ databaseId: dbId, tableId: 'reviews', queries: [Query.limit(LIMIT)] })
        ]);

        // Post-processing same as client hook
        // Build Category Map
        const fetchedCategories = currentCategoriesDocs?.rows || [];
        const categoriesMap = fetchedCategories.reduce((acc, cat) => {
            acc[cat.$id] = cat.nombre;
            return acc;
        }, {});

        // Helper to filter by date in memory
        const filterDate = (docs, start, end, field = '$createdAt') => {
            const s = new Date(start).getTime();
            const e = new Date(end).getTime();
            return docs.filter(d => {
                const t = new Date(d[field]).getTime();
                return t >= s && t <= e;
            });
        };

        const validCurrentReviews = filterDate(currentReviews.rows, startDate, endDate);
        const validPreviousReviews = filterDate(previousReviews.rows, previousStart, previousEnd);

        const adDocs = currentAds.rows;
        const paidDocs = currentPaidAds.rows;
        const paidLogs = currentLogs.rows; // Approximation as per original client logic
        const previousPaidLogs = previousLogs.rows;

        // Calculate KPIs
        const adKPIs = calculateAdKPIs(adDocs, adDocs, categoriesMap);
        const orderKPIs = calculateOrderKPIs(currentOrders.rows, previousOrders.rows);
        const qualityKPIs = calculateQualityKPIs(validCurrentReviews, validPreviousReviews);
        const engagementKPIs = calculateEngagementKPIs(currentLogs.rows, previousLogs.rows);
        const userKPIs = calculateUserKPIs(adDocs, adDocs);
        const paidAdKPIs = calculatePaidAdKPIs(paidDocs, paidLogs, currentOrders.rows, previousPaidLogs, previousOrders.rows);
        const systemHealth = calculateSystemHealth(currentLogs.rows);

        return NextResponse.json({
            ads: adKPIs,
            orders: orderKPIs,
            quality: qualityKPIs,
            engagement: engagementKPIs,
            users: userKPIs,
            paidAds: paidAdKPIs,
            systemHealth
        });

    } catch (error) {
        console.error('BFF /dashboard/stats Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats', details: error.message },
            { status: 500 }
        );
    }
}
