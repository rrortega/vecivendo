import { NextResponse } from 'next/server';
import { databases, dbId } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

const METRICS_COLLECTION = 'ad_metrics';

export async function GET(request, { params }) {
    const { id } = params; // ad_id

    try {
        // Fetch all metrics records for this ad
        // In a real large-scale app, we would aggregate on DB side or use specialized queries,
        // but Appwrite is NoSQL document based. We fetch records.
        // Assuming not millions of records per ad yet. Pagination might be needed later.
        const metrics = await databases.listDocuments(
            dbId,
            METRICS_COLLECTION,
            [
                Query.equal('ad_id', id),
                Query.limit(100) // Limit for now
            ]
        );

        // Aggregate data
        let totalSpend = 0;
        let totalViews = 0;
        let totalClicks = 0;

        const byResidential = {};

        metrics.documents.forEach(doc => {
            totalSpend += doc.spend || 0;
            totalViews += doc.views || 0;
            totalClicks += doc.clicks || 0;

            if (!byResidential[doc.residential_id]) {
                byResidential[doc.residential_id] = {
                    id: doc.residential_id,
                    name: doc.residential_name || 'Desconocido',
                    views: 0,
                    clicks: 0,
                    spend: 0
                };
            }
            byResidential[doc.residential_id].views += doc.views || 0;
            byResidential[doc.residential_id].clicks += doc.clicks || 0;
            byResidential[doc.residential_id].spend += doc.spend || 0;
        });

        const breakdown = Object.values(byResidential);

        return NextResponse.json({
            total: {
                spend: totalSpend,
                views: totalViews,
                clicks: totalClicks
            },
            breakdown: breakdown
        });

    } catch (error) {
        console.error('❌ [API] Error obteniendo metricas:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
