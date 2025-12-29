/**
 * Script de prueba de consistencia de categorías
 * Compara el conteo calculado (usado en los badges) con el listado real (usado en el grid)
 */

const BASE_URL = 'http://localhost:3000';
const RESIDENTIAL_ID = '6929413600221d70d537'; // Jardines del Sur 6 (Active ID)
const CATEGORY_TO_TEST = 'deportes';

async function testConsistency() {
    console.log(`🚀 Iniciando prueba de consistencia para el residencial: ${RESIDENTIAL_ID}\n`);

    try {
        // 1. Obtener todas las categorías para tener los nombres reales
        console.log('📦 Obteniendo categorías...');
        const catRes = await fetch(`${BASE_URL}/api/categories`);
        if (!catRes.ok) throw new Error('Error al obtener categorías');
        const { documents: categories } = await catRes.json();
        console.log(`✅ ${categories.length} categorías obtenidas.\n`);

        // 2. Obtener anuncios base (los que usa useCategoryStats.js para contar)
        console.log('🔍 Obteniendo anuncios de /api/ads (fuente para conteo)...');
        const adsRes = await fetch(`${BASE_URL}/api/ads?residential=${RESIDENTIAL_ID}&active=true&limit=1000`);
        if (!adsRes.ok) throw new Error('Error al obtener anuncios base');
        const { documents: allAds } = await adsRes.json();
        console.log(`✅ ${allAds.length} anuncios activos encontrados.\n`);

        // 3. Calcular conteo manualmente (Lógica de useCategoryStats.js)
        const counts = {};
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
                counts[catSlug] = (counts[catSlug] || 0) + 1;
            }
        });

        console.log('📊 Conteos calculados (Badge):');
        Object.entries(counts).forEach(([slug, count]) => {
            console.log(`   - ${slug}: ${count}`);
        });
        console.log('\n');

        // 4. Comparar con /api/ads/list para cada categoría detectada
        console.log('⚖️ Comparando con /api/ads/list (fuente para el Grid):');
        console.log('---------------------------------------------------------');
        console.log('| Categoría       | Badge | Grid  | Resultado |');
        console.log('---------------------------------------------------------');

        let errors = 0;

        for (const [slug, badgeCount] of Object.entries(counts)) {
            const listRes = await fetch(`${BASE_URL}/api/ads/list?residentialId=${RESIDENTIAL_ID}&category=${slug}&limit=10000`);
            if (!listRes.ok) {
                console.log(`| ${slug.padEnd(15)} | ${badgeCount.toString().padEnd(5)} | ERR   | ❌ ERROR API |`);
                errors++;
                continue;
            }
            const { total: gridCount, documents: listDocs } = await listRes.json();

            const status = badgeCount === gridCount ? '✅ OK' : '❌ DISCREPANCIA';
            if (badgeCount !== gridCount) errors++;

            console.log(`| ${slug.padEnd(15)} | ${badgeCount.toString().padEnd(5)} | ${gridCount.toString().padEnd(5)} | ${status.padEnd(10)} |`);

            if (badgeCount !== gridCount && badgeCount > 0) {
                // Investigar el anuncio que falta
                const badgeAdsInCategory = allAds.filter(ad => {
                    // Misma lógica de asignación de slug
                    let s = ad.categoria_slug;
                    if (!s && ad.categoria) {
                        const n = ad.categoria.toLowerCase().trim();
                        const match = categories.find(c => c.nombre.toLowerCase() === n || c.slug === n);
                        s = match ? match.slug : n.replace(/\s+/g, '-');
                    }
                    return s?.toLowerCase() === slug;
                });

                console.log(`   ⚠️ Detalle de discrepancia en ${slug}:`);
                console.log(`     - Encontrados en Badge pero no en Grid (posiblemente):`);
                badgeAdsInCategory.forEach(ad => {
                    const foundInGrid = listDocs.find(ga => ga.$id === ad.$id);
                    if (!foundInGrid) {
                        console.log(`       * ID: ${ad.$id} | Título: ${ad.titulo} | cat_slug: ${ad.categoria_slug} | cat: ${ad.categoria}`);
                    }
                });
            }
        }
        console.log('---------------------------------------------------------');

        if (errors === 0) {
            console.log('\n✨ ¡CONGRATULATIONS! Todos los conteos coinciden perfectamente.');
        } else {
            console.log(`\n🚨 Se encontraron ${errors} discrepancias. Se requiere corrección.`);
        }

    } catch (error) {
        console.error('\n❌ Error durante la prueba:', error.message);
    }
}

testConsistency();
