import { test, expect } from '@playwright/test'
import { loginViaApi, loginViaUI, clearAuth, TEST_CREDENTIALS } from './helpers/auth'

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // The page should display the Orchestra branding
    await expect(page.locator('h1')).toContainText('Orchestra')

    // The "Acesse sua conta" heading should be visible
    await expect(page.locator('h2')).toContainText('Acesse sua conta')

    // Email and password fields should be present
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()

    // The submit button should be present with "Entrar" label
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toContainText('Entrar')
  })

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await loginViaUI(page)

    // After successful login, should be on dashboard or admin dashboard
    // The URL should be either '/' or '/admin' depending on user role
    const url = page.url()
    expect(url.includes('/login')).toBeFalsy()

    // The page should contain dashboard content
    // "Dashboard" heading is present for both regular and admin dashboards
    await expect(
      page.locator('h1').filter({ hasText: /Dashboard/ }),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.fill('#email', 'wrong@email.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should remain on the login page
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/login')

    // An error notification or inline error should appear.
    // vue-toastification renders toasts in a container, or inline validation errors show.
    const hasToastError = await page.locator('.Vue-Toastification__toast--error').isVisible().catch(() => false)
    const hasInlineError = await page.locator('text=Credenciais').isVisible().catch(() => false)
    const hasGenericError = await page.locator('text=Erro').isVisible().catch(() => false)
    const hasUnauthorized = await page.locator('text=não autorizado').isVisible().catch(() => false)

    // At least one error indicator should be present
    expect(hasToastError || hasInlineError || hasGenericError || hasUnauthorized).toBeTruthy()
  })

  test('logout clears session and redirects to login', async ({ page }) => {
    // Login first
    await loginViaApi(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Verify we are authenticated (on dashboard)
    await expect(
      page.locator('h1').filter({ hasText: /Dashboard/ }),
    ).toBeVisible({ timeout: 10_000 })

    // Clear auth to simulate logout
    await clearAuth(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('protected routes redirect to login when unauthenticated', async ({ page }) => {
    // Try to visit various protected routes without authentication
    const protectedRoutes = ['/events', '/vendors', '/proposals', '/settings']

    for (const route of protectedRoutes) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      // Should be redirected to login, potentially with a redirect query param
      await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
    }
  })
})
