import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
const LOGS_COLLECTION_ID = "logs";

// Helper to get or create a session ID
const getSessionId = () => {
    if (typeof window === 'undefined') return null;
    let sessionId = localStorage.getItem('vecivendo_session_id');
    if (!sessionId) {
        sessionId = ID.unique();
        localStorage.setItem('vecivendo_session_id', sessionId);
    }
    return sessionId;
};

const getDeviceType = () => {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "tablet";
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "mobile";
    }
    return "desktop";
};

const getOS = () => {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (ua.indexOf("Win") !== -1) return "Windows";
    if (ua.indexOf("Mac") !== -1) return "MacOS";
    if (ua.indexOf("Linux") !== -1) return "Linux";
    if (ua.indexOf("Android") !== -1) return "Android";
    if (ua.indexOf("like Mac") !== -1) return "iOS";
    return "Other";
};

const getBrowser = () => {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (ua.indexOf("Chrome") !== -1 && ua.indexOf("Edg") === -1 && ua.indexOf("OPR") === -1) return "Chrome";
    if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) return "Safari";
    if (ua.indexOf("Firefox") !== -1) return "Firefox";
    if (ua.indexOf("Edg") !== -1) return "Edge";
    if (ua.indexOf("OPR") !== -1 || ua.indexOf("Opera") !== -1) return "Opera";
    return "Other";
};

export const logAdView = async (adId, isPaidAd = false, user = null, type = 'view') => {
    try {
        const sessionId = getSessionId();
        if (!sessionId) return; // Should not happen on client

        // Don't log views from admin panel
        if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/console') || window.location.pathname.startsWith('/admin'))) {
            console.log("Ad view ignored (admin panel)");
            return;
        }

        const queryField = isPaidAd ? "anuncioPagoId" : "anuncioId";

        // Rate limiting logic: Only for 'view' events
        if (type === 'view') {
            // Check for recent logs (within last 1 hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

            const recentLogs = await databases.listDocuments(
                DB_ID,
                LOGS_COLLECTION_ID,
                [
                    Query.equal(queryField, adId),
                    Query.equal("sessionId", sessionId),
                    Query.equal("type", "view"),
                    Query.greaterThan("timestamp", oneHourAgo),
                    Query.limit(1)
                ]
            );

            if (recentLogs.documents.length > 0) {
                // Already logged recently
                console.log("View already logged recently");
                return;
            }
        }

        // Create new log
        const logData = {
            [queryField]: adId,
            sessionId: sessionId,
            visitorId: user ? user.$id : null,
            type: type,
            deviceType: getDeviceType(),
            os: getOS(),
            browser: getBrowser(),
            source: document.referrer.includes(window.location.hostname) ? 'internal' : (document.referrer || 'direct'),
            timestamp: new Date().toISOString(),
            // Geolocation would typically be handled by a backend function or edge function to avoid exposing API keys or trusting client data blindly.
            // For now, we omit it or could use a public IP API if strictly required client-side.
        };

        await databases.createDocument(
            DB_ID,
            LOGS_COLLECTION_ID,
            ID.unique(),
            logData
        );

        console.log(`Ad ${type} logged successfully`);
    } catch (error) {
        console.error(`Error logging ad ${type}:`, error);
    }
};

export const getAdAnalytics = async (adId) => {
    try {
        // Fetch logs for this ad
        // Note: For high volume, we should rely on Appwrite's aggregation or a separate stats collection.
        // Fetching ALL logs is not scalable. We'll fetch a summary or limit for now.

        // For this demo/MVP, we'll fetch up to 1000 logs to calculate stats.
        const logs = await databases.listDocuments(
            DB_ID,
            LOGS_COLLECTION_ID,
            [
                Query.equal("anuncioId", adId),
                Query.equal("type", "view"), // Only count views for general stats
                Query.limit(1000)
            ]
        );

        const documents = logs.documents;
        const totalViews = logs.total;

        // Calculate stats
        const deviceBreakdown = documents.reduce((acc, log) => {
            const device = log.deviceType || 'unknown';
            acc[device] = (acc[device] || 0) + 1;
            return acc;
        }, {});

        const osBreakdown = documents.reduce((acc, log) => {
            const os = log.os || 'unknown';
            acc[os] = (acc[os] || 0) + 1;
            return acc;
        }, {});

        const browserBreakdown = documents.reduce((acc, log) => {
            const browser = log.browser || 'unknown';
            acc[browser] = (acc[browser] || 0) + 1;
            return acc;
        }, {});

        // Convert to percentages
        const toPercentage = (breakdown) => {
            Object.keys(breakdown).forEach(key => {
                breakdown[key] = Math.round((breakdown[key] / documents.length) * 100);
            });
            return breakdown;
        };

        toPercentage(deviceBreakdown);
        toPercentage(osBreakdown);
        toPercentage(browserBreakdown);

        const trafficSources = documents.reduce((acc, log) => {
            const source = log.source || 'unknown';
            // Simplify sources
            let key = 'direct';
            if (source.includes('google')) key = 'search';
            else if (source.includes('facebook') || source.includes('instagram')) key = 'social';
            else if (source === 'internal') key = 'internal';
            else if (source !== 'direct') key = 'referral';

            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        Object.keys(trafficSources).forEach(key => {
            trafficSources[key] = Math.round((trafficSources[key] / documents.length) * 100);
        });

        return {
            views: totalViews,
            uniqueVisitors: new Set(documents.map(d => d.sessionId)).size,
            avgDuration: 0, // Not tracking duration yet
            deviceBreakdown: deviceBreakdown,
            osBreakdown: osBreakdown,
            browserBreakdown: browserBreakdown,
            trafficSources: trafficSources,
            recentViews: documents.slice(0, 5)
        };

    } catch (error) {
        console.error("Error fetching analytics:", error);
        // Return mock data on error to prevent UI crash
        return {
            views: 0,
            uniqueVisitors: 0,
            avgDuration: 0,
            deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
            trafficSources: { direct: 0, search: 0, social: 0 },
            recentViews: []
        };
    }
};
