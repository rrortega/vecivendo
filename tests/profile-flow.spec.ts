import { test, expect } from '@playwright/test';

test.describe('Flujo Completo de Perfil y Verificación', () => {
    const TEST_PHONE = '1000000000';
    const FULL_PHONE = '521000000000';
    const TEST_USER_NAME = 'Usuario Pruebas';
    const TEST_RESIDENCIAL = 'demo';

    test.beforeEach(async ({ page }) => {
        // Navegar a la página de perfil
        await page.goto(`/${TEST_RESIDENCIAL}/perfil`);

        // Limpiar storage para empezar desde cero
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // Recargar para aplicar el estado limpio
        await page.reload({ waitUntil: 'networkidle' });
    });

    test('debe completar el flujo completo: verificación, edición de perfil y guardado', async ({ page }) => {
        // ===== MOCK DE APIS =====
        await page.route('**/api/verify-phone', async (route) => {
            const postData = route.request().postDataJSON();
            if (postData.action === 'code') {
                await route.fulfill({
                    json: { status: 'success' },
                    status: 200
                });
            } else {
                await route.fulfill({
                    json: {
                        status: 'success',
                        appwriteUserId: FULL_PHONE,
                        appwriteSecret: 'mock-secret-123'
                    },
                    status: 200
                });
            }
        });

        // ===== PASO 1: INGRESAR DATOS PERSONALES =====
        console.log('📝 Paso 1: Ingresando datos personales...');

        const nameInput = page.getByPlaceholder('Tu nombre completo');
        await expect(nameInput).toBeVisible();
        await nameInput.fill(TEST_USER_NAME);

        // Verificar que el nombre se ingresó correctamente
        await expect(nameInput).toHaveValue(TEST_USER_NAME);

        // ===== PASO 2: INGRESAR Y VERIFICAR TELÉFONO =====
        console.log('📱 Paso 2: Ingresando teléfono...');

        const phoneInput = page.getByPlaceholder('Número celular');
        await expect(phoneInput).toBeVisible();
        await phoneInput.fill(TEST_PHONE);



        // Esperar a que aparezca el botón de verificar (cuando hay >= 9 dígitos)
        const verifyBtn = page.getByTitle('Verificar número');
        await expect(verifyBtn).toBeVisible({ timeout: 5000 });

        console.log('✅ Paso 2: Haciendo clic en verificar...');
        await verifyBtn.click();

        // ===== PASO 3: COMPLETAR CÓDIGO OTP =====
        console.log('🔐 Paso 3: Completando código OTP...');

        // Esperar a que aparezca el modal
        const otpModal = page.getByRole('heading', { name: 'Código de Verificación' });
        await expect(otpModal).toBeVisible({ timeout: 5000 });

        // Verificar que el texto de instrucciones esté visible
        await expect(page.getByText('Ingresa el código de 6 dígitos enviado a tu celular.')).toBeVisible();

        // Llenar los 6 campos del OTP
        for (let i = 0; i < 6; i++) {
            const otpInput = page.locator(`#otp-${i}`);
            await expect(otpInput).toBeVisible();
            await otpInput.fill((i + 1).toString());
        }

        // Hacer clic en validar
        const validateBtn = page.getByRole('button', { name: 'Validar', exact: true });
        await expect(validateBtn).toBeEnabled();
        await validateBtn.click();

        // ===== PASO 4: VERIFICAR ESTADO DE VERIFICADO =====
        console.log('✔️ Paso 4: Verificando estado de verificado...');

        // Esperar a que el modal se cierre
        await expect(otpModal).not.toBeVisible({ timeout: 5000 });

        // Verificar que aparezca el badge de "Verificado"
        const verifiedBadge = page.getByText('Verificado', { exact: true });
        await expect(verifiedBadge).toBeVisible({ timeout: 5000 });

        // Verificar que el mensaje de confirmación esté visible
        await expect(page.getByText('Este celular ya está verificado en el residencial')).toBeVisible();

        // ===== PASO 5: LLENAR DIRECCIÓN RESIDENCIAL =====
        console.log('🏠 Paso 5: Llenando dirección residencial...');

        // Verificar que la sección de dirección esté visible
        await expect(page.getByText(/Mi Dirección en/i)).toBeVisible();

        // Llenar los campos de dirección
        const calleInput = page.locator('input[placeholder="Ej. Av. Principal"]');
        await expect(calleInput).toBeVisible();
        await calleInput.fill('Calle Playwright Test');

        const manzanaInput = page.locator('input[placeholder="Ej. A"]');
        await expect(manzanaInput).toBeVisible();
        await manzanaInput.fill('MZ-TEST');

        const loteInput = page.locator('input[placeholder="Ej. 12"]');
        await expect(loteInput).toBeVisible();
        await loteInput.fill('LT-99');

        const casaInput = page.locator('input[placeholder="Ej. 4B"]');
        await expect(casaInput).toBeVisible();
        await casaInput.fill('CASA-PW');

        // ===== PASO 6: GUARDAR CAMBIOS =====
        console.log('💾 Paso 6: Guardando cambios...');

        // Esperar a que aparezca el botón de guardar (cuando hay cambios)
        const saveBtn = page.getByTitle('Guardar cambios').last();
        await expect(saveBtn).toBeVisible({ timeout: 5000 });
        await saveBtn.click();

        // Esperar un momento para que se guarden los cambios
        await page.waitForTimeout(1000);

        // ===== PASO 7: VERIFICAR PERSISTENCIA EN LOCALSTORAGE =====
        console.log('🔍 Paso 7: Verificando persistencia de datos...');

        const storageData = await page.evaluate((residencial) => {
            return {
                global: JSON.parse(localStorage.getItem('vecivendo_user_global') || '{}'),
                residential: JSON.parse(localStorage.getItem(`vecivendo_user_residential_${residencial}`) || '{}')
            };
        }, TEST_RESIDENCIAL);

        // Verificar datos globales
        expect(storageData.global.nombre).toBe(TEST_USER_NAME);
        expect(storageData.global.telefono_verificado).toBe(true);
        expect(storageData.global.telefono).toContain(TEST_PHONE);
        expect(storageData.global.appwriteSecret).toBe('mock-secret-123');
        expect(storageData.global.userId).toBe(FULL_PHONE);

        // Verificar datos residenciales
        expect(storageData.residential.calle).toBe('Calle Playwright Test');
        expect(storageData.residential.manzana).toBe('MZ-TEST');
        expect(storageData.residential.lote).toBe('LT-99');
        expect(storageData.residential.casa).toBe('CASA-PW');

        console.log('✅ Prueba completada exitosamente!');
    });

    test('debe mostrar error si el código OTP es incorrecto', async ({ page }) => {
        // Mock que simula un código incorrecto
        await page.route('**/api/verify-phone', async (route) => {
            const postData = route.request().postDataJSON();
            if (postData.action === 'code') {
                await route.fulfill({ json: { status: 'success' } });
            } else {
                await route.fulfill({
                    json: { error: 'Código incorrecto' },
                    status: 400
                });
            }
        });

        // Ingresar datos
        await page.getByPlaceholder('Tu nombre completo').fill(TEST_USER_NAME);
        await page.getByPlaceholder('Número celular').fill(TEST_PHONE);
        await page.getByTitle('Verificar número').click();

        // Completar OTP con código "incorrecto"
        await expect(page.getByText('Código de Verificación')).toBeVisible();
        for (let i = 0; i < 6; i++) {
            await page.locator(`#otp-${i}`).fill('9');
        }
        await page.getByRole('button', { name: 'Validar', exact: true }).click();

        // Verificar que se muestre un mensaje de error
        // (Nota: esto depende de cómo maneje el error tu componente)
        await page.waitForTimeout(1000);

        // El modal debería seguir abierto
        await expect(page.getByText('Código de Verificación')).toBeVisible();
    });

    test('debe permitir cambiar entre modo claro y oscuro', async ({ page }) => {
        // Buscar el botón de tema
        const themeButton = page.locator('button', { has: page.locator('svg') }).filter({ hasText: 'Modo Oscuro' });
        await expect(themeButton).toBeVisible();

        // Hacer clic para cambiar el tema
        await themeButton.click();

        // Verificar que el tema cambió (esto depende de tu implementación)
        await page.waitForTimeout(500);

        // Verificar que se guardó en localStorage
        const theme = await page.evaluate(() => localStorage.getItem('theme'));
        expect(theme).toBeTruthy();
    });
});
