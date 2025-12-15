import { NextResponse } from 'next/server';
import { Query } from 'node-appwrite';
import { databases, dbId } from '@/lib/appwrite-server';
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
            databases.listDocuments(dbId, 'anuncios', adQueries),
            databases.listDocuments(dbId, 'logs', currentLogsQuery),
            databases.listDocuments(dbId, 'pedidos', currentOrdersQuery),
            databases.listDocuments(dbId, 'reviews', [Query.limit(LIMIT)]),
            databases.listDocuments(dbId, 'anuncios_pago', [Query.limit(LIMIT)]),
            databases.listDocuments(dbId, 'categorias', [Query.limit(100)]),

            // Previous
            databases.listDocuments(dbId, 'logs', previousLogsQuery),
            databases.listDocuments(dbId, 'pedidos', previousOrdersQuery),
            databases.listDocuments(dbId, 'reviews', [Query.limit(LIMIT)])
        ]);

        // Post-processing same as client hook
        // Build Category Map
        const fetchedCategories = currentCategoriesDocs?.documents || [];
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

        const validCurrentReviews = filterDate(currentReviews.documents, startDate, endDate);
        const validPreviousReviews = filterDate(previousReviews.documents, previousStart, previousEnd);

        const adDocs = currentAds.documents;
        const paidDocs = currentPaidAds.documents;
        const paidLogs = currentLogs.documents; // Approximation as per original client logic
        const previousPaidLogs = previousLogs.documents;

        // Calculate KPIs
        const adKPIs = calculateAdKPIs(adDocs, adDocs, categoriesMap);
        const orderKPIs = calculateOrderKPIs(currentOrders.documents, previousOrders.documents);
        const qualityKPIs = calculateQualityKPIs(validCurrentReviews, validPreviousReviews);
        const engagementKPIs = calculateEngagementKPIs(currentLogs.documents, previousLogs.documents);
        const userKPIs = calculateUserKPIs(adDocs, adDocs);
        const paidAdKPIs = calculatePaidAdKPIs(paidDocs, paidLogs, currentOrders.documents, previousPaidLogs, previousOrders.documents);
        const systemHealth = calculateSystemHealth(currentLogs.documents);

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
