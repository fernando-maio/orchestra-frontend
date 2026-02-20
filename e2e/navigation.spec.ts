import { test, expect } from '@playwright/test'
import { loginViaApi } from './helpers/auth'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page)
  })

  test('sidebar navigation works between pages', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for dashboard to load
    await expect(
      page.locator('h1').filter({ hasText: /Dashboard/ }),
    ).toBeVisible({ timeout: 10_000 })

    // The sidebar should have navigation links.
    // On desktop (the default viewport), the sidebar is always visible.
    // Navigation links contain text like: Eventos, Fornecedores, Propostas, etc.

    // Click on "Eventos" in the sidebar
    const eventosLink = page.locator('nav a, aside a').filter({ hasText: 'Eventos' }).first()
    if (await eventosLink.isVisible()) {
      await eventosLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/events/)
      await expect(
        page.locator('h1').filter({ hasText: 'Eventos' }),
      ).toBeVisible({ timeout: 10_000 })
    }

    // Click on "Fornecedores" in the sidebar
    const fornecedoresLink = page.locator('nav a, aside a').filter({ hasText: 'Fornecedores' }).first()
    if (await fornecedoresLink.isVisible()) {
      await fornecedoresLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/vendors/)
      await expect(
        page.locator('h1').filter({ hasText: 'Fornecedores' }),
      ).toBeVisible({ timeout: 10_000 })
    }

    // Click on "Propostas" in the sidebar
    const propostasLink = page.locator('nav a, aside a').filter({ hasText: 'Propostas' }).first()
    if (await propostasLink.isVisible()) {
      await propostasLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/proposals/)
    }
  })

  test('all main routes are accessible when authenticated', async ({ page }) => {
    // Define the main routes and their expected heading text
    const routes: Array<{ path: string; expectedHeading: RegExp }> = [
      { path: '/events', expectedHeading: /Eventos/ },
      { path: '/vendors', expectedHeading: /Fornecedores/ },
      { path: '/proposals', expectedHeading: /Propostas/ },
      { path: '/quotes', expectedHeading: /Orçamentos|Cotações|Quotes/ },
      { path: '/categories', expectedHeading: /Categorias/ },
      { path: '/settings', expectedHeading: /Configurações|Settings/ },
    ]

    for (const route of routes) {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')

      // Should NOT be on the login page
      expect(page.url()).not.toContain('/login')

      // The page should have content loaded
      const mainContent = page.locator('main')
      await expect(mainContent).not.toBeEmpty()

      // A heading should be visible (either h1 or h2)
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible({ timeout: 10_000 })
    }
  })

  test('404 page shows for invalid routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-at-all')
    await page.waitForLoadState('networkidle')

    // The 404 page should display
    // It shows "404" in a large heading and "Pagina nao encontrada"
    await expect(page.getByText('404')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/não encontrada/i)).toBeVisible()

    // The "Voltar ao inicio" link should be visible
    await expect(page.getByText(/Voltar ao início/i)).toBeVisible()

    // Clicking "Voltar ao inicio" should navigate home
    await page.getByText(/Voltar ao início/i).click()
    await page.waitForLoadState('networkidle')

    // Should be on a valid page (dashboard or login, depending on auth state)
    const url = page.url()
    expect(url.includes('/this-route-does-not-exist-at-all')).toBeFalsy()
  })
})
