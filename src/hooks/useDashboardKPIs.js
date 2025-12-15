import { useState, useEffect, useCallback } from 'react';
import { client } from '@/lib/appwrite';

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

export function useDashboardKPIs(startDate, endDate, residentialIds = null, categories = []) {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchKPIs = useCallback(async () => {
        if (!startDate || !endDate) return;

        try {
            setLoading(true);
            setError(null);

            const url = new URL('/api/dashboard/stats', window.location.origin);
            url.searchParams.append('startDate', startDate.toISOString());
            url.searchParams.append('endDate', endDate.toISOString());

            if (residentialIds && residentialIds.length > 0) {
                url.searchParams.append('residentialIds', residentialIds.join(','));
            }

            if (categories && categories.length > 0) {
                url.searchParams.append('categories', categories.join(','));
            }

            const response = await fetch(url.toString());

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Request failed: ${response.status}`);
            }

            const data = await response.json();
            setKpis(data);

        } catch (err) {
            console.error('Error fetching dashboard KPIs:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, residentialIds, categories]);

    // Fetch inicial
    useEffect(() => {
        fetchKPIs();
    }, [fetchKPIs]);

    // Subscription for real-time updates
    useEffect(() => {
        // Keep direct client subscription for realtime only
        // This triggers a re-fetch to the stats API when data changes
        const unsubscribe = client.subscribe(
            `databases.${DB_ID}.collections.anuncios.documents`,
            response => {
                if (response.events.includes('databases.*.collections.*.documents.*.create') ||
                    response.events.includes('databases.*.collections.*.documents.*.update') ||
                    response.events.includes('databases.*.collections.*.documents.*.delete')) {
                    fetchKPIs();
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, [fetchKPIs]);

    return { kpis, loading, error, refresh: fetchKPIs };
}
