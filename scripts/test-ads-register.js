#!/usr/bin/env node

/**
 * Script de prueba para el endpoint /api/ads/register
 * 
 * Uso:
 *   node scripts/test-ads-register.js
 * 
 * Asegúrate de tener la variable ADS_API_KEY en tu .env.local
 */

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_KEY = process.env.ADS_API_KEY;

if (!API_KEY) {
    console.error('❌ Error: ADS_API_KEY no está configurada en .env.local');
    process.exit(1);
}

// Datos de prueba
const testAd = {
    titulo: "iPhone 14 Pro - Prueba API",
    precio: 18000,
    celular_anunciante: "5512345678",
    descripcion: "iPhone 14 Pro en excelente estado, incluye cargador y caja original",
    categoria: "Electrónica",
    imagenes: [
        "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800",
        "https://images.unsplash.com/photo-1678652197838-b5d6e1a6ec40?w=800"
    ],
    activo: true
};

async function testRegisterAd(adData) {
    console.log('\n🔄 Probando endpoint /api/ads/register...\n');
    console.log('📦 Datos del anuncio:');
    console.log(JSON.stringify(adData, null, 2));
    console.log('\n');

    try {
        const response = await fetch(`${API_URL}/api/ads/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(adData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`✅ ${result.message}`);
            console.log(`📝 Acción: ${result.action}`);
            console.log(`🆔 ID: ${result.ad.$id}`);
            console.log(`📅 Last Capture: ${result.ad.last_capture}`);
            console.log('\n✨ Respuesta completa:');
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.error(`❌ Error ${response.status}:`);
            console.error(JSON.stringify(result, null, 2));
        }

        return result;
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        throw error;
    }
}

async function runTests() {
    console.log('🚀 Iniciando pruebas del endpoint de registro de anuncios\n');
    console.log(`🌐 URL: ${API_URL}/api/ads/register`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);

    try {
        // Test 1: Crear nuevo anuncio
        console.log('\n' + '='.repeat(60));
        console.log('TEST 1: Crear nuevo anuncio');
        console.log('='.repeat(60));
        const result1 = await testRegisterAd(testAd);

        // Esperar 2 segundos
        console.log('\n⏳ Esperando 2 segundos...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: Actualizar anuncio existente (mismo título, precio y celular)
        console.log('\n' + '='.repeat(60));
        console.log('TEST 2: Actualizar anuncio existente');
        console.log('='.repeat(60));
        const result2 = await testRegisterAd({
            ...testAd,
            descripcion: "Descripción actualizada - ahora con audífonos incluidos"
        });

        // Test 3: Crear anuncio diferente (diferente precio)
        console.log('\n' + '='.repeat(60));
        console.log('TEST 3: Crear anuncio con precio diferente');
        console.log('='.repeat(60));
        const result3 = await testRegisterAd({
            ...testAd,
            precio: 19000,
            descripcion: "Versión con más almacenamiento"
        });

        // Resumen
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE PRUEBAS');
        console.log('='.repeat(60));
        console.log(`Test 1: ${result1.action === 'created' ? '✅ PASS' : '❌ FAIL'} - Debería crear`);
        console.log(`Test 2: ${result2.action === 'updated' ? '✅ PASS' : '❌ FAIL'} - Debería actualizar`);
        console.log(`Test 3: ${result3.action === 'created' ? '✅ PASS' : '❌ FAIL'} - Debería crear (precio diferente)`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error.message);
        process.exit(1);
    }
}

// Ejecutar pruebas
runTests();
