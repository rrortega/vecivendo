import { Query } from 'appwrite';

/**
 * Calcula el rango de fechas para el período anterior basado en el rango actual
 * @param {Date} startDate - Fecha de inicio del período actual
 * @param {Date} endDate - Fecha de fin del período actual
 * @returns {{previousStart: Date, previousEnd: Date}} - Rango del período anterior
 */
export function getPreviousPeriod(startDate, endDate) {
    const duration = endDate.getTime() - startDate.getTime();
    const previousEnd = new Date(startDate.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);

    return {
        previousStart,
        previousEnd
    };
}

/**
 * Calcula el cambio porcentual entre dos valores
 * @param {number} current - Valor actual
 * @param {number} previous - Valor anterior
 * @returns {{percentage: number, trend: 'up'|'down'|'neutral'}} - Cambio porcentual y tendencia
 */
export function calculateChange(current, previous) {
    if (previous === 0) {
        return {
            percentage: current > 0 ? 100 : 0,
            trend: current > 0 ? 'up' : 'neutral'
        };
    }

    const percentage = ((current - previous) / previous) * 100;
    const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';

    return {
        percentage: Math.abs(percentage),
        trend
    };
}

/**
 * Filtra documentos por rango de fechas
 * @param {Array} documents - Array de documentos
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 * @param {string} dateField - Campo de fecha a usar (por defecto '$createdAt')
 * @returns {Array} - Documentos filtrados
 */
export function filterByDateRange(documents, startDate, endDate, dateField = '$createdAt') {
    const start = startDate.getTime();
    const end = endDate.getTime();

    return documents.filter(doc => {
        const docDate = new Date(doc[dateField]).getTime();
        return docDate >= start && docDate <= end;
    });
}

/**
 * Calcula KPIs de anuncios
 * @param {Array} anuncios - Array de anuncios
 * @param {Array} previousAnuncios - Array de anuncios del período anterior
 * @param {Object} categoriesMap - Mapa de ID de categoría a Nombre (opcional)
 * @returns {Object} - KPIs de anuncios
 */
export function calculateAdKPIs(anuncios, previousAnuncios, categoriesMap = {}) {
    const activeAds = anuncios.filter(ad => ad.activo);
    const previousActiveAds = previousAnuncios.filter(ad => ad.activo);

    const inactiveAds = anuncios.filter(ad => !ad.activo);
    const previousInactiveAds = previousAnuncios.filter(ad => !ad.activo);

    // Anuncios por categoría
    const adsByCategory = anuncios.reduce((acc, ad) => {
        // Try to get category ID: could be a string, or an object if expanded
        let categoryId = null;
        let categoryName = 'Sin categoría';

        if (ad.categorias && Array.isArray(ad.categorias) && ad.categorias.length > 0) {
            // If array, take first for counting (simplified) or count all?
            // Usually one main category. Let's iterate if we want multi-category, 
            // but 'adsByCategory' usually implies one bucket. 
            // User said "distinct by category". 
            // Let's pick the first one's ID/Object.
            const firstCat = ad.categorias[0];
            categoryId = typeof firstCat === 'object' ? firstCat.$id : firstCat;
            categoryName = typeof firstCat === 'object' ? (firstCat.nombre || firstCat.name) : (categoriesMap[firstCat] || categoryId);
        } else if (ad.categoria) {
            // Legacy singular field check
            const cat = ad.categoria;
            categoryId = typeof cat === 'object' ? cat.$id : cat;
            categoryName = typeof cat === 'object' ? (cat.nombre || cat.name) : (categoriesMap[categoryId] || categoryId);
        }

        // Apply distinct name resolution
        if (!categoryName) categoryName = 'Sin categoría';

        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
    }, {});

    // Anuncios por residencial
    const adsByResidential = anuncios.reduce((acc, ad) => {
        const residentialId = ad.residencial_id?.$id || ad.residencial_id || 'Sin residencial';
        acc[residentialId] = (acc[residentialId] || 0) + 1;
        return acc;
    }, {});

    // Anuncios próximos a vencer (7 días)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringAds = anuncios.filter(ad => {
        if (!ad.$updatedAt || !ad.dias_vigencia) return false;
        const updatedDate = new Date(ad.$updatedAt);
        const expiryDate = new Date(updatedDate.getTime() + ad.dias_vigencia * 24 * 60 * 60 * 1000);
        return expiryDate >= now && expiryDate <= sevenDaysFromNow;
    });

    return {
        totalActive: activeAds.length,
        totalActivePrevious: previousActiveAds.length,
        totalActiveChange: calculateChange(activeAds.length, previousActiveAds.length),
        totalInactive: inactiveAds.length,
        totalInactiveChange: calculateChange(inactiveAds.length, previousInactiveAds.length),
        adsByCategory,
        adsByResidential,
        expiringAds: expiringAds.length,
        growthRate: calculateChange(anuncios.length, previousAnuncios.length)
    };
}

/**
 * Calcula KPIs de engagement
 * @param {Array} logs - Array de logs
 * @param {Array} previousLogs - Array de logs del período anterior
 * @returns {Object} - KPIs de engagement
 */
export function calculateEngagementKPIs(logs, previousLogs) {
    const views = logs.filter(log => log.type === 'view');
    const clicks = logs.filter(log => log.type === 'click');
    const previousViews = previousLogs.filter(log => log.type === 'view');
    const previousClicks = previousLogs.filter(log => log.type === 'click');

    // Visualizaciones únicas (por sessionId)
    const uniqueViews = new Set(views.map(log => log.sessionId)).size;
    const previousUniqueViews = new Set(previousViews.map(log => log.sessionId)).size;

    // CTR (Click Through Rate)
    const ctr = views.length > 0 ? (clicks.length / views.length) * 100 : 0;
    const previousCtr = previousViews.length > 0 ? (previousClicks.length / previousViews.length) * 100 : 0;

    // Engagement por dispositivo
    const deviceBreakdown = logs.reduce((acc, log) => {
        const device = log.deviceType || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
    }, {});

    return {
        totalViews: views.length,
        totalViewsPrevious: previousViews.length,
        totalViewsChange: calculateChange(views.length, previousViews.length),
        uniqueViews,
        uniqueViewsPrevious: previousUniqueViews,
        uniqueViewsChange: calculateChange(uniqueViews, previousUniqueViews),
        totalClicks: clicks.length,
        totalClicksPrevious: previousClicks.length,
        totalClicksChange: calculateChange(clicks.length, previousClicks.length),
        ctr,
        ctrPrevious: previousCtr,
        ctrChange: calculateChange(ctr, previousCtr),
        deviceBreakdown
    };
}

/**
 * Calcula KPIs de pedidos
 * @param {Array} pedidos - Array de pedidos
 * @param {Array} previousPedidos - Array de pedidos del período anterior
 * @returns {Object} - KPIs de pedidos
 */
export function calculateOrderKPIs(pedidos, previousPedidos) {
    const totalValue = pedidos.reduce((sum, order) => sum + (order.total || 0), 0);
    const previousTotalValue = previousPedidos.reduce((sum, order) => sum + (order.total || 0), 0);

    const avgTicket = pedidos.length > 0 ? totalValue / pedidos.length : 0;
    const previousAvgTicket = previousPedidos.length > 0 ? previousTotalValue / previousPedidos.length : 0;

    // Pedidos por estado
    const ordersByStatus = pedidos.reduce((acc, order) => {
        const status = order.estado || 'pendiente';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    return {
        totalOrders: pedidos.length,
        totalOrdersPrevious: previousPedidos.length,
        totalOrdersChange: calculateChange(pedidos.length, previousPedidos.length),
        totalValue,
        totalValuePrevious: previousTotalValue,
        totalValueChange: calculateChange(totalValue, previousTotalValue),
        avgTicket,
        avgTicketPrevious: previousAvgTicket,
        avgTicketChange: calculateChange(avgTicket, previousAvgTicket),
        ordersByStatus
    };
}

/**
 * Calcula tasa de conversión de pedidos
 * @param {number} totalOrders - Total de pedidos
 * @param {number} totalViews - Total de visualizaciones
 * @returns {number} - Tasa de conversión en porcentaje
 */
export function calculateConversionRate(totalOrders, totalViews) {
    return totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;
}

/**
 * Calcula KPIs de usuarios
 * @param {Array} anunciantes - Array de anunciantes (derivado de anuncios)
 * @param {Array} previousAnunciantes - Array de anunciantes del período anterior
 * @returns {Object} - KPIs de usuarios
 */
export function calculateUserKPIs(anuncios, previousAnuncios) {
    // Extraer anunciantes únicos
    const activeAdvertisers = new Set(
        anuncios
            .filter(ad => ad.anunciante_id)
            .map(ad => ad.anunciante_id.$id || ad.anunciante_id)
    );

    const previousActiveAdvertisers = new Set(
        previousAnuncios
            .filter(ad => ad.anunciante_id)
            .map(ad => ad.anunciante_id.$id || ad.anunciante_id)
    );

    // Nuevos anunciantes (que están en el período actual pero no en el anterior)
    const newAdvertisers = [...activeAdvertisers].filter(
        id => !previousActiveAdvertisers.has(id)
    );

    // Anunciantes por residencial
    const advertisersByResidential = anuncios.reduce((acc, ad) => {
        if (!ad.anunciante_id) return acc;
        const advertiserId = ad.anunciante_id.$id || ad.anunciante_id;
        const residentialId = ad.residencial_id?.$id || ad.residencial_id || 'Sin residencial';

        if (!acc[residentialId]) {
            acc[residentialId] = new Set();
        }
        acc[residentialId].add(advertiserId);
        return acc;
    }, {});

    // Convertir Sets a números
    Object.keys(advertisersByResidential).forEach(key => {
        advertisersByResidential[key] = advertisersByResidential[key].size;
    });

    return {
        activeAdvertisers: activeAdvertisers.size,
        activeAdvertisersPrevious: previousActiveAdvertisers.size,
        activeAdvertisersChange: calculateChange(activeAdvertisers.size, previousActiveAdvertisers.size),
        newAdvertisers: newAdvertisers.length,
        advertisersByResidential
    };
}

/**
 * Calcula KPIs de publicidad pagada
 * @param {Array} paidAds - Array de anuncios pagados
 * @param {Array} paidLogs - Array de logs de anuncios pagados
 * @param {Array} previousPaidAds - Array de anuncios pagados del período anterior
 * @param {Array} previousPaidLogs - Array de logs del período anterior
 * @returns {Object} - KPIs de publicidad pagada
 */
export function calculatePaidAdKPIs(paidAds, paidLogs, previousPaidAds, previousPaidLogs) {
    const activeAds = paidAds.filter(ad => ad.activo);
    const previousActiveAds = previousPaidAds.filter(ad => ad.activo);

    const impressions = paidLogs.filter(log => log.type === 'view');
    const clicks = paidLogs.filter(log => log.type === 'click');
    const previousImpressions = previousPaidLogs.filter(log => log.type === 'view');
    const previousClicks = previousPaidLogs.filter(log => log.type === 'click');

    const ctr = impressions.length > 0 ? (clicks.length / impressions.length) * 100 : 0;
    const previousCtr = previousImpressions.length > 0 ? (previousClicks.length / previousImpressions.length) * 100 : 0;

    return {
        activePaidAds: activeAds.length,
        activePaidAdsPrevious: previousActiveAds.length,
        activePaidAdsChange: calculateChange(activeAds.length, previousActiveAds.length),
        impressions: impressions.length,
        impressionsPrevious: previousImpressions.length,
        impressionsChange: calculateChange(impressions.length, previousImpressions.length),
        ctr,
        ctrPrevious: previousCtr,
        ctrChange: calculateChange(ctr, previousCtr)
    };
}

/**
 * Calcula KPIs de calidad
 * @param {Array} reviews - Array de reseñas
 * @param {Array} previousReviews - Array de reseñas del período anterior
 * @returns {Object} - KPIs de calidad
 */
export function calculateQualityKPIs(reviews, previousReviews) {
    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review.puntuacion || 0), 0) / reviews.length
        : 0;

    const previousAvgRating = previousReviews.length > 0
        ? previousReviews.reduce((sum, review) => sum + (review.puntuacion || 0), 0) / previousReviews.length
        : 0;

    // Distribución de calificaciones
    const ratingDistribution = reviews.reduce((acc, review) => {
        const rating = review.puntuacion || 0;
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
    }, {});

    return {
        totalReviews: reviews.length,
        totalReviewsPrevious: previousReviews.length,
        totalReviewsChange: calculateChange(reviews.length, previousReviews.length),
        avgRating: Math.round(avgRating * 10) / 10,
        avgRatingPrevious: Math.round(previousAvgRating * 10) / 10,
        avgRatingChange: calculateChange(avgRating, previousAvgRating),
        ratingDistribution
    };
}

/**
 * Formatea un número como moneda
 * @param {number} value - Valor a formatear
 * @param {string} currency - Código de moneda (por defecto 'USD')
 * @returns {string} - Valor formateado
 */
export function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: currency
    }).format(value);
}

/**
 * Formatea un número con separadores de miles
 * @param {number} value - Valor a formatear
 * @returns {string} - Valor formateado
 */
export function formatNumber(value) {
    return new Intl.NumberFormat('es-DO').format(value);
}

/**
 * Formatea un porcentaje
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Número de decimales (por defecto 1)
 * @returns {string} - Valor formateado
 */
export function formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Calcula la salud del sistema basado en logs
 * @param {Array} logs - Array de logs
 * @returns {Object} - Métrica de salud del sistema
 */
export function calculateSystemHealth(logs = []) {
    // Simple implementation based on error logs presence
    const errorCount = logs.filter(l => l.type === 'error' || l.level === 'error').length;
    return {
        status: errorCount > 0 ? 'degraded' : 'healthy',
        errorCount
    };
}
