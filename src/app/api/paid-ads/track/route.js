import { NextResponse } from 'next/server';
import { databases, dbId } from '@/lib/appwrite-server';
import { ID, Query } from 'node-appwrite';

const PAID_ADS_COLLECTION_ID = 'anuncios_pago';
const PAID_ADS_STATS_COLLECTION_ID = 'anuncios_pago_stats';
const LOGS_COLLECTION_ID = 'logs';

const COSTS_COLLECTION_VIEW = 'costo_por_vista';
const COSTS_COLLECTION_CLICK = 'costo_por_click';

/**
 * Helper to get current cost
 */
async function getCost(type) {
    try {
        const collectionId = type === 'view' ? COSTS_COLLECTION_VIEW : COSTS_COLLECTION_CLICK;
        // Try to fetch specific cost doc or list first one
        const response = await databases.listDocuments(dbId, collectionId, [Query.limit(1)]);
        if (response.documents.length > 0) {
            return response.documents[0].costo || (type === 'view' ? 1 : 5);
        }
        return type === 'view' ? 1 : 5;
    } catch (error) {
        console.warn('Error fetching cost:', error);
        return type === 'view' ? 1 : 5;
    }
}

/**
 * POST /api/paid-ads/track
 * Tracks views and clicks for paid ads.
 * Updates both the main ad document, daily stats, and central logs.
 * Deactivates ad if credits run out.
 * Body: { adId: string, type: 'view' | 'click', sessionId: string, residentialId: string, source: string }
 */
export async function POST(request) {
    try {
        const { adId, type, sessionId, residentialId, source } = await request.json();

        if (!adId || !type) {
            return NextResponse.json(
                { error: 'Missing adId or type' },
                { status: 400 }
            );
        }

        if (!['view', 'click'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "view" or "click"' },
                { status: 400 }
            );
        }

        // Parse User Agent
        const userAgent = request.headers.get('user-agent') || '';
        const referer = source || request.headers.get('referer') || 'direct';

        // Get Cost
        const cost = await getCost(type);

        // Get current ad
        const ad = await databases.getDocument(
            dbId,
            PAID_ADS_COLLECTION_ID,
            adId
        );

        if (!ad) {
            return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
        }

        // Deduct credits
        const currentCredits = ad.creditos || 0;
        const newCredits = Math.max(0, currentCredits - cost);
        const shouldDeactivate = newCredits <= 0;

        // Log to central logs table
        const logPromise = databases.createDocument(
            dbId,
            LOGS_COLLECTION_ID,
            ID.unique(),
            {
                anuncioPagoId: adId,
                type: type,
                sessionId: sessionId || 'unknown',
                deviceType: getDeviceType(userAgent),
                os: getOS(userAgent),
                browser: getBrowser(userAgent),
                source: referer,
                timestamp: new Date().toISOString(),
                residencialId: residentialId || null,
                cost: cost
            }
        ).catch(err => {
            console.warn('⚠️ [API] Failed to write to logs collection:', err.message);
        });

        // Increment the appropriate counter on main ad and update credits
        const updateData = {
            creditos: newCredits
        };

        if (type === 'view') {
            updateData.vistas = (ad.vistas || 0) + 1;
        } else if (type === 'click') {
            updateData.clicks = (ad.clicks || 0) + 1;
        }

        if (shouldDeactivate) {
            updateData.active = false;
        }

        // Update the main ad document
        await databases.updateDocument(
            dbId,
            PAID_ADS_COLLECTION_ID,
            adId,
            updateData
        );

        // Update or create daily stats
        const statsPromise = updateDailyStats(adId, type);

        await Promise.allSettled([logPromise, statsPromise]);

        return NextResponse.json({
            success: true,
            type,
            newValue: updateData[type === 'view' ? 'vistas' : 'clicks'],
            creditsRemaining: newCredits,
            deactivated: shouldDeactivate
        });
    } catch (error) {
        console.error('❌ [API] Error tracking paid ad:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * Update or create daily stats document for budget tracking
 */
async function updateDailyStats(adId, type) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();

        // Try to find existing stats for today
        const existingStats = await databases.listDocuments(
            dbId,
            PAID_ADS_STATS_COLLECTION_ID,
            [
                Query.equal('ad_id', adId),
                Query.equal('date', todayStr),
                Query.limit(1)
            ]
        ).catch(() => ({ documents: [] }));

        if (existingStats.documents.length > 0) {
            // Update existing stats
            const stats = existingStats.documents[0];
            const updateField = type === 'view' ? 'views' : 'clicks';
            await databases.updateDocument(
                dbId,
                PAID_ADS_STATS_COLLECTION_ID,
                stats.$id,
                { [updateField]: (stats[updateField] || 0) + 1 }
            );
        } else {
            // Create new stats document for today
            await databases.createDocument(
                dbId,
                PAID_ADS_STATS_COLLECTION_ID,
                ID.unique(),
                {
                    ad_id: adId,
                    date: todayStr,
                    views: type === 'view' ? 1 : 0,
                    clicks: type === 'click' ? 1 : 0,
                }
            ).catch((error) => {
                // Collection might not exist yet, log but don't fail
                console.warn('[Track] Could not create daily stats:', error.message);
            });
        }
    } catch (error) {
        // Don't fail the main tracking if stats update fails
        console.warn('[Track] Error updating daily stats:', error.message);
    }
}

// UA Helpers
const getDeviceType = (ua) => {
    if (!ua) return 'unknown';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "tablet";
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "mobile";
    }
    return "desktop";
};

const getOS = (ua) => {
    if (!ua) return 'unknown';
    if (ua.includes("Win")) return "Windows";
    if (ua.includes("Mac")) return "MacOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("like Mac")) return "iOS";
    return "Other";
};

const getBrowser = (ua) => {
    if (!ua) return 'unknown';
    if (ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR")) return "Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
    return "Other";
};

