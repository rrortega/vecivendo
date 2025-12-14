import { NextResponse } from 'next/server';
import { databases, dbId } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

const PAID_ADS_COLLECTION_ID = 'anuncios_pago';
const PAID_ADS_STATS_COLLECTION_ID = 'anuncios_pago_stats';

// Cost per view and click in credits
const CREDIT_COST_VIEW = 1;
const CREDIT_COST_CLICK = 5;

/**
 * Calculate how many credits an ad can spend per day based on total budget and date range
 */
function calculateDailyBudget(ad) {
    const budget = ad.creditos || 0;
    if (budget <= 0) return 0;

    const startDate = new Date(ad.fecha_inicio);
    const endDate = new Date(ad.fecha_fin);

    // Calculate days between start and end (inclusive)
    const timeDiff = endDate.getTime() - startDate.getTime();
    const days = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1);

    return budget / days;
}

/**
 * Get today's spending for an ad
 */
async function getTodaySpending(adId) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.toISOString();

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayEnd = tomorrow.toISOString();

        // Try to get today's stats from stats collection
        const statsResponse = await databases.listDocuments(
            dbId,
            PAID_ADS_STATS_COLLECTION_ID,
            [
                Query.equal('ad_id', adId),
                Query.greaterThanEqual('date', todayStart),
                Query.lessThan('date', todayEnd),
                Query.limit(1)
            ]
        ).catch(() => ({ documents: [] }));

        if (statsResponse.documents.length > 0) {
            const stats = statsResponse.documents[0];
            const views = stats.views || 0;
            const clicks = stats.clicks || 0;
            return (views * CREDIT_COST_VIEW) + (clicks * CREDIT_COST_CLICK);
        }

        return 0;
    } catch (error) {
        console.error('Error getting today spending for ad', adId, error);
        return 0;
    }
}

/**
 * GET /api/paid-ads/public
 * Returns active paid ads, optionally filtered by type and category.
 * Now includes budget filtering - ads that have exceeded their daily limit are excluded.
 * 
 * Query params:
 *  - type: 'banner' | 'embedded' | 'cross' (optional)
 *  - category: category slug (optional)
 *  - residentialId: filter by residential target (optional)
 *  - limit: max results (default 20)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const category = searchParams.get('category');
        const residentialId = searchParams.get('residentialId');
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        const now = new Date().toISOString();

        // Build queries - fetch more initially to filter by budget later
        const queries = [
            Query.equal('active', true),
            Query.lessThanEqual('fecha_inicio', now),
            Query.greaterThanEqual('fecha_fin', now),
            Query.limit(Math.min(limit * 3, 100)) // Fetch extra to account for budget filtering
        ];

        if (type) {
            queries.push(Query.equal('type', type));
        }

        const response = await databases.listDocuments(
            dbId,
            PAID_ADS_COLLECTION_ID,
            queries
        );

        let ads = response.documents;

        // Filter by category
        if (category) {
            ads = ads.filter(ad => {
                // If no categories specified, show to all
                if (!ad.categorias && !ad.categories) return true;
                const cats = ad.categorias || ad.categories || [];
                if (cats.length === 0) return true;

                return cats.some(cat => {
                    if (typeof cat === 'object' && cat.slug) {
                        return cat.slug === category;
                    }
                    return cat === category;
                });
            });
        }

        // Filter by residential target
        if (residentialId) {
            ads = ads.filter(ad => {
                if (!ad.residenciales || ad.residenciales.length === 0) return true;
                return ad.residenciales.some(res => {
                    if (typeof res === 'object') return res.$id === residentialId;
                    return res === residentialId;
                });
            });
        }

        // Filter by daily budget - check if ad can still spend today
        const budgetFilteredAds = [];
        for (const ad of ads) {
            const dailyBudget = calculateDailyBudget(ad);

            // If no budget limit, include the ad
            if (dailyBudget <= 0) {
                budgetFilteredAds.push({
                    ...ad,
                    _dailyBudget: 0,
                    _todaySpent: 0,
                    _budgetRemaining: 0
                });
                continue;
            }

            const todaySpent = await getTodaySpending(ad.$id);

            // Only include if daily budget not exceeded
            if (todaySpent < dailyBudget) {
                budgetFilteredAds.push({
                    ...ad,
                    _dailyBudget: dailyBudget,
                    _todaySpent: todaySpent,
                    _budgetRemaining: dailyBudget - todaySpent
                });
            }
        }

        // Shuffle and limit results
        const shuffled = budgetFilteredAds.sort(() => Math.random() - 0.5);
        const finalAds = shuffled.slice(0, limit);

        return NextResponse.json({
            documents: finalAds,
            total: finalAds.length
        }, {
            headers: {
                // Cache for 30 seconds on CDN
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            }
        });
    } catch (error) {
        console.error('❌ [API] Error fetching public paid ads:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

