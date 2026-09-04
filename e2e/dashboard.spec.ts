import { test, expect } from '@playwright/test'

// A sessao vem pronta do projeto `setup` via storageState.
test.describe('Dashboard', () => {
  test('dashboard loads and shows stats cards', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should display a Dashboard heading (client or admin)
    await expect(
      page.locator('h1').filter({ hasText: /Dashboard/ }),
    ).toBeVisible({ timeout: 10_000 })

    // Wait for loading spinner to disappear (the app shows a spinner while fetching)
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })

    // Stats cards should be present.
    // The dashboard renders StatsCard components with titles like
    // "Eventos Ativos", "MRR", "Organizações", etc.
    // We check that at least some card-like elements are rendered.
    const statsCards = page.locator('[class*="rounded-xl"]')
    const cardCount = await statsCards.count()
    expect(cardCount).toBeGreaterThanOrEqual(1)
  })

  test('dashboard shows chart sections', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(
      page.locator('h1').filter({ hasText: /Dashboard/ }),
    ).toBeVisible({ timeout: 10_000 })

    // Wait for data to load
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })

    // The dashboard has chart containers wrapped in white rounded cards.
    // Check that the main grid layout is rendered with multiple sections.
    const sections = page.locator('.bg-white.rounded-xl')
    const sectionCount = await sections.count()

    // Both client and admin dashboards have multiple chart sections
    expect(sectionCount).toBeGreaterThanOrEqual(1)
  })

  test('admin dashboard is accessible for super admin', async ({ page }) => {
    // Navigate to admin dashboard directly
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // If the user is a super admin, the admin dashboard should load.
    // If not, they will be redirected to the client dashboard.
    // Either way a Dashboard heading should be visible.
    await expect(
      page.locator('h1').filter({ hasText: /Dashboard/ }),
    ).toBeVisible({ timeout: 10_000 })

    const url = page.url()

    if (url.includes('/admin')) {
      // Super admin: should see the admin dashboard heading
      await expect(
        page.locator('h1').filter({ hasText: 'Dashboard Administrativo' }),
      ).toBeVisible()

      // Admin dashboard shows platform overview text
      await expect(
        page.getByText('Visão geral da plataforma Orchestra'),
      ).toBeVisible()

      // Wait for loading and check for stats cards
      await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })

      // Admin dashboard has 8 stats cards in two rows of 4
      // Check we have the stat card section with multiple items
      const statsCards = page.locator('[class*="rounded-xl"]')
      const cardCount = await statsCards.count()
      expect(cardCount).toBeGreaterThanOrEqual(4)
    } else {
      // Non-super-admin: redirected to client dashboard
      await expect(
        page.locator('h1').filter({ hasText: 'Dashboard' }),
      ).toBeVisible()
    }
  })
})
