import { test, expect } from '@playwright/test';

/**
 * Test E2E para validar la consistencia de conteos de categorías
 * 
 * Este test verifica que:
 * 1. Los conteos de /api/ads coincidan con /api/ads/list para cada categoría
 * 2. Los badges mostrados en el cliente coincidan con los datos del API
 * 3. Los anuncios mostrados en el grid coincidan con el conteo del badge
 */

const RESIDENTIAL_ID = '6929413600221d70d537'; // Jardines del Sur 6
const RESIDENTIAL_SLUG = 'mx-cun-jds6';

test.describe('Category Count Consistency', () => {

    test('API endpoints should return consistent counts', async ({ request }) => {
        // 1. Obtener categorías
        const categoriesResponse = await request.get('/api/categories');
        expect(categoriesResponse.ok()).toBeTruthy();
        const categoriesData = await categoriesResponse.json();
        const categories = categoriesData.documents;

        // 2. Obtener anuncios de /api/ads (fuente para badges)
        const adsResponse = await request.get(`/api/ads?residential=${RESIDENTIAL_ID}&active=true&limit=1000`);
        expect(adsResponse.ok()).toBeTruthy();
        const adsData = await adsResponse.json();
        const allAds = adsData.documents;

        // 3. Calcular conteos por categoría (simulando useCategoryStats)
        const categoryCounts = {};
        allAds.forEach(ad => {
            let catSlug = ad.categoria_slug;

            if (!catSlug && ad.categoria) {
                const normalizedAdCat = ad.categoria.toLowerCase().trim();
                const match = categories.find(c =>
                    c.nombre.toLowerCase() === normalizedAdCat ||
                    c.slug === normalizedAdCat
                );
                if (match) {
                    catSlug = match.slug;
                } else {
                    catSlug = normalizedAdCat.replace(/\s+/g, '-');
                }
            }

            if (catSlug) {
                catSlug = catSlug.toLowerCase();
                categoryCounts[catSlug] = (categoryCounts[catSlug] || 0) + 1;
            }
        });

        // 4. Comparar con /api/ads/list para cada categoría
        const discrepancies = [];

        for (const category of categories) {
            const badgeCount = categoryCounts[category.slug] || 0;

            // Solo probar categorías con anuncios
            if (badgeCount > 0) {
                const listResponse = await request.get(
                    `/api/ads/list?residentialId=${RESIDENTIAL_ID}&category=${category.slug}&limit=1000`
                );
                expect(listResponse.ok()).toBeTruthy();
                const listData = await listResponse.json();
                const gridCount = listData.total || 0;

                if (badgeCount !== gridCount) {
                    discrepancies.push({
                        category: category.slug,
                        badgeCount,
                        gridCount,
                    });
                }
            }
        }

        // Verificar que no haya discrepancias
        expect(discrepancies).toHaveLength(0);
    });

    test('Client-side badges should match API counts', async ({ page }) => {
        // Navegar a la página principal
        await page.goto(`/${RESIDENTIAL_SLUG}`);

        // Esperar a que cargue el sidebar con las categorías
        await page.waitForSelector('aside', { timeout: 10000 });

        // Obtener el conteo total del badge "Todas"
        const totalBadge = await page.locator('button:has-text("Todas") span[class*="rounded-full"]').textContent();
        const totalCount = parseInt(totalBadge?.trim() || '0');

        // Verificar que el total sea mayor a 0
        expect(totalCount).toBeGreaterThan(0);

        // Obtener anuncios del API para comparar
        const adsData = await page.request.get(`/api/ads?residential=${RESIDENTIAL_ID}&active=true&limit=1000`);
        const adsJson = await adsData.json();
        const apiTotalCount = adsJson.total || adsJson.documents.length;

        // El conteo del badge debe coincidir con el API
        expect(totalCount).toBe(apiTotalCount);
    });

    test('Grid should display ads and badges should show correct counts', async ({ page }) => {
        // Obtener categorías del API
        const categoriesData = await page.request.get('/api/categories');
        const categoriesJson = await categoriesData.json();
        const categories = categoriesJson.documents;

        // Obtener anuncios para calcular conteos
        const adsData = await page.request.get(`/api/ads?residential=${RESIDENTIAL_ID}&active=true&limit=1000`);
        const adsJson = await adsData.json();
        const allAds = adsJson.documents;

        // Calcular conteos
        const categoryCounts = {};
        allAds.forEach(ad => {
            let catSlug = ad.categoria_slug;

            if (!catSlug && ad.categoria) {
                const normalizedAdCat = ad.categoria.toLowerCase().trim();
                const match = categories.find(c =>
                    c.nombre.toLowerCase() === normalizedAdCat ||
                    c.slug === normalizedAdCat
                );
                if (match) {
                    catSlug = match.slug;
                } else {
                    catSlug = normalizedAdCat.replace(/\s+/g, '-');
                }
            }

            if (catSlug) {
                catSlug = catSlug.toLowerCase();
                categoryCounts[catSlug] = (categoryCounts[catSlug] || 0) + 1;
            }
        });

        // Probar 3 categorías con diferentes cantidades de anuncios
        const categoriesToTest = categories
            .filter(cat => (categoryCounts[cat.slug] || 0) > 0)
            .slice(0, 3);

        for (const category of categoriesToTest) {
            const expectedCount = categoryCounts[category.slug];

            // Navegar a la categoría
            await page.goto(`/${RESIDENTIAL_SLUG}?category=${category.slug}`);

            // Esperar a que cargue el grid
            await page.waitForSelector('div[class*="grid"]', { timeout: 10000 });

            // Esperar un poco más para que se rendericen los anuncios
            await page.waitForTimeout(2000);

            // Contar los links de anuncios en el grid (primera página, máximo 24)
            const adLinks = await page.locator('a[href*="/anuncio/"]').count();

            // El número de anuncios mostrados debe ser el menor entre expectedCount y 24 (tamaño de página)
            const expectedVisible = Math.min(expectedCount, 24);
            expect(adLinks).toBe(expectedVisible);

            // Verificar que el badge de la categoría muestra el conteo TOTAL correcto
            const categoryButton = page.locator(`button:has-text("${category.nombre}")`);
            const badge = categoryButton.locator('span[class*="rounded-full"]');
            const badgeText = await badge.textContent();
            const badgeCount = parseInt(badgeText?.trim() || '0');

            // El badge debe mostrar el total, no solo los visibles
            expect(badgeCount).toBe(expectedCount);
        }
    });

    test('Empty categories should not display any ads', async ({ page }) => {
        // Obtener categorías del API
        const categoriesData = await page.request.get('/api/categories');
        const categoriesJson = await categoriesData.json();
        const categories = categoriesJson.documents;

        // Obtener anuncios para calcular conteos
        const adsData = await page.request.get(`/api/ads?residential=${RESIDENTIAL_ID}&active=true&limit=1000`);
        const adsJson = await adsData.json();
        const allAds = adsJson.documents;

        // Calcular conteos
        const categoryCounts = {};
        allAds.forEach(ad => {
            let catSlug = ad.categoria_slug;
            if (catSlug) {
                catSlug = catSlug.toLowerCase();
                categoryCounts[catSlug] = (categoryCounts[catSlug] || 0) + 1;
            }
        });

        // Encontrar una categoría vacía
        const emptyCategory = categories.find(cat => (categoryCounts[cat.slug] || 0) === 0);

        if (emptyCategory) {
            // Navegar a la categoría vacía
            await page.goto(`/${RESIDENTIAL_SLUG}?category=${emptyCategory.slug}`);

            // Esperar a que cargue la página
            await page.waitForTimeout(3000);

            // No debe haber links de anuncios
            const adLinks = await page.locator('a[href*="/anuncio/"]').count();
            expect(adLinks).toBe(0);

            // El badge debe mostrar 0 o no existir
            const categoryButton = page.locator(`button:has-text("${emptyCategory.nombre}")`);
            const badgeExists = await categoryButton.locator('span[class*="rounded-full"]').count();

            if (badgeExists > 0) {
                const badgeText = await categoryButton.locator('span[class*="rounded-full"]').textContent();
                const badgeCount = parseInt(badgeText?.trim() || '0');
                expect(badgeCount).toBe(0);
            }
        }
    });
});
