import { useState, useEffect, useCallback } from 'react';
import { client } from '@/lib/appwrite';

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

export function useDashboardKPIs(startDate, endDate, residentialIds = null, categories = []) {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingSections, setLoadingSections] = useState({});
    const [error, setError] = useState(null);

    const fetchKPIs = useCallback(async () => {
        if (!startDate || !endDate) return;

        try {
            setLoading(true);
            setError(null);

            const sections = ['ads', 'orders', 'engagement', 'paidAds', 'quality', 'users'];

            // Inicializar todas las secciones como cargando
            const initialLoading = {};
            sections.forEach(s => initialLoading[s] = true);
            setLoadingSections(initialLoading);

            const baseParams = new URLSearchParams();
            baseParams.append('startDate', startDate.toISOString());
            baseParams.append('endDate', endDate.toISOString());

            if (residentialIds && residentialIds.length > 0) {
                baseParams.append('residentialIds', residentialIds.join(','));
            }

            if (categories && categories.length > 0) {
                baseParams.append('categories', categories.join(','));
            }

            // Función para cargar una sección específica y mezclarla en el estado
            const fetchSection = async (section) => {
                try {
                    const url = `/api/dashboard/stats?${baseParams.toString()}&section=${section}`;
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Error en sección ${section}`);
                    const data = await response.json();

                    setKpis(prev => ({
                        ...(prev || {}),
                        ...data
                    }));
                } finally {
                    setLoadingSections(prev => ({
                        ...prev,
                        [section]: false
                    }));
                }
            };

            // Ejecutar todas las peticiones en paralelo
            await Promise.allSettled(sections.map(s => fetchSection(s)));

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

    return { kpis, loading, loadingSections, error, refresh: fetchKPIs };
}
