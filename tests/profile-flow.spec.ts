import { test, expect } from '@playwright/test';

test.describe('Flujo de Perfil y Verificación', () => {
    const TEST_PHONE = '1000000000';
    const FULL_PHONE = '521000000000';
    const TEST_USER_NAME = 'Usuario Pruebas';
    const TEST_RESIDENCIAL = 'demo';

    test.beforeEach(async ({ page }) => {
        await page.goto(`/${TEST_RESIDENCIAL}/perfil`);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.reload({ waitUntil: 'networkidle' });
    });

    test('debería completar el flujo de verificación y permitir guardar cambios', async ({ page }) => {
        // 1. Mock de la API de verificación
        await page.route('**/api/verify-phone', async (route) => {
            const postData = route.request().postDataJSON();
            if (postData.action === 'code') {
                await route.fulfill({ json: { status: 'success' } });
            } else {
                await route.fulfill({
                    json: {
                        status: 'success',
                        appwriteUserId: FULL_PHONE,
                        appwriteSecret: 'mock-secret-123'
                    }
                });
            }
        });

        // 2. Ingresar nombre
        await page.getByPlaceholder('Tu nombre completo').fill(TEST_USER_NAME);

        // 3. Ingresar teléfono y validar
        await page.getByPlaceholder('Número celular').fill(TEST_PHONE);
        const verifyBtn = page.getByTitle('Verificar número');
        await expect(verifyBtn).toBeVisible();
        await verifyBtn.click();

        // 4. Completar OTP
        await expect(page.getByText('Código de Verificación')).toBeVisible();
        for (let i = 0; i < 6; i++) {
            await page.locator(`#otp-${i}`).fill((i + 1).toString());
        }
        await page.getByRole('button', { name: 'Validar', exact: true }).click();

        // 5. Verificar estado de verificado
        await expect(page.getByText('Verificado', { exact: true })).toBeVisible();

        // 6. Llenar dirección residencial
        await page.locator('input[placeholder="Ej. Av. Principal"]').fill('Calle Playwright');
        await page.locator('input[placeholder="Ej. A"]').fill('MZ TEST');

        // 7. Esperar a que el botón de guardar aparezca (isDirty && changes)
        // El botón tiene title="Guardar cambios" y contiene el componente Save (un SVG)
        const saveBtn = page.getByTitle('Guardar cambios').last();
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        // 8. Verificar que los cambios persistan
        const profileData = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('vecivendo_user_global'));
        });
        expect(profileData.nombre).toBe(TEST_USER_NAME);
        expect(profileData.telefono_verificado).toBe(true);
    });
});
