import { NextResponse } from 'next/server';
import { tablesDB, dbId } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

const METRICS_COLLECTION = 'ad_metrics';

export async function GET(request, { params }) {
    const { id } = params; // ad_id

    try {
        // Fetch all metrics records for this ad
        // In a real large-scale app, we would aggregate on DB side or use specialized queries,
        // but Appwrite is NoSQL document based. We fetch records.
        // Assuming not millions of records per ad yet. Pagination might be needed later.
        // Fetch logs for this paid ad
        // Note: For scalability, we should use aggregation queries or the daily stats collection.
        // Following user request to sum from logs.
        const logs = await tablesDB.listRows({
            databaseId: dbId,
            tableId: 'logs',
            queries: [
                Query.equal('anuncioPagoId', id),
                Query.limit(5000) // Safety limit
            ]
        });

        // Aggregate data
        let totalSpend = 0;
        let totalViews = 0;
        let totalClicks = 0;

        const byResidential = {};
        const byDate = {};

        logs.rows.forEach(doc => {
            const cost = doc.cost || 0;
            const type = doc.type;
            const resId = doc.residencialId || 'unknown';
            const date = doc.$createdAt.split('T')[0]; // YYYY-MM-DD

            totalSpend += cost;
            if (type === 'view') totalViews++;
            if (type === 'click') totalClicks++;

            // Residential Sync
            if (!byResidential[resId]) {
                byResidential[resId] = {
                    id: resId,
                    name: 'Cargando...',
                    views: 0,
                    clicks: 0,
                    spend: 0
                };
            }
            byResidential[resId].views += (type === 'view' ? 1 : 0);
            byResidential[resId].clicks += (type === 'click' ? 1 : 0);
            byResidential[resId].spend += cost;

            // Date Sync
            if (!byDate[date]) {
                byDate[date] = { date, views: 0, clicks: 0, spend: 0 };
            }
            byDate[date].views += (type === 'view' ? 1 : 0);
            byDate[date].clicks += (type === 'click' ? 1 : 0);
            byDate[date].spend += cost;
        });

        // Fetch residential details
        const uniqueResIds = Object.keys(byResidential).filter(id => id && id !== 'unknown');

        if (uniqueResIds.length > 0) {
            try {
                // Fetch residentials in parallel batches or single query if possible
                // Appwrite supports array in equal query
                const residentialDocs = await tablesDB.listRows({
                    databaseId: dbId,
                    tableId: 'residenciales',
                    queries: [
                        Query.equal('$id', uniqueResIds),
                        Query.limit(100)
                    ]
                });

                residentialDocs.rows.forEach(res => {
                    if (byResidential[res.$id]) {
                        byResidential[res.$id].name = res.nombre;
                        // Format: "Name (City, State)" or just fields
                        byResidential[res.$id].location = `${res.provincia_estado || ''}, ${res.country || ''}`.replace(/^, /, '').replace(/, $/, '');
                        // Append location to name for UI if needed, or send as separate field
                        if (byResidential[res.$id].location) {
                            byResidential[res.$id].name = `${res.nombre} - ${byResidential[res.$id].location}`;
                        }
                    }
                });
            } catch (err) {
                console.error("Error fetching residential names:", err);
                // Fallback to "Desconocido" or keep "Cargando..." logic (but we initialized it)
                // Actually if failed, it might stay as "Cargando..." or we should set to "Error" or "ID: ..."
            }
        }

        const breakdown = Object.values(byResidential);
        // Sort history by date ascending
        const history = Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date));

        return NextResponse.json({
            total: {
                spend: totalSpend,
                views: totalViews,
                clicks: totalClicks
            },
            breakdown: breakdown,
            history: history
        });

    } catch (error) {
        console.error('❌ [API] Error obteniendo metricas:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
