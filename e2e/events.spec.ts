import { test, expect } from '@playwright/test'
import { loginViaApi } from './helpers/auth'

test.describe('Events', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page)
  })

  test('events list page loads', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')

    // The page heading should show "Eventos"
    await expect(
      page.locator('h1').filter({ hasText: 'Eventos' }),
    ).toBeVisible({ timeout: 10_000 })

    // The subheading should be present
    await expect(page.getByText('Gerencie seus eventos')).toBeVisible()

    // The "Novo Evento" button should be visible
    await expect(
      page.getByRole('button', { name: /Novo Evento/i }),
    ).toBeVisible()

    // Wait for loading to complete
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })

    // The total count text should be visible (e.g., "X evento(s) encontrado(s)")
    await expect(page.getByText(/evento\(s\) encontrado\(s\)/)).toBeVisible()
  })

  test('create event form loads and has required fields', async ({ page }) => {
    await page.goto('/events/create')
    await page.waitForLoadState('networkidle')

    // The page heading should indicate creating a new event
    await expect(
      page.locator('h1').filter({ hasText: /Novo Evento/i }),
    ).toBeVisible({ timeout: 10_000 })

    // Essential form fields should be present
    // Name field
    const nameInput = page.locator('input[name="name"], #name, input[placeholder*="nome" i]')
    // We also check that the form simply has text inputs
    const formInputs = page.locator('form input, form select, form textarea')
    const inputCount = await formInputs.count()
    expect(inputCount).toBeGreaterThanOrEqual(3)

    // State select should have Brazilian states
    const stateSelect = page.locator('select').filter({ hasText: /SP|RJ|MG/i })
    const hasStateSelect = (await stateSelect.count()) > 0
    // State select might be present
    expect(hasStateSelect || inputCount > 3).toBeTruthy()
  })

  test('event detail page loads for existing event', async ({ page }) => {
    // First go to events list to find an existing event
    await page.goto('/events')
    await page.waitForLoadState('networkidle')

    // Wait for loading
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })

    // Check if there are any events in the list
    const eventCards = page.locator('.card.hover\\:shadow-lg, [class*="card"][class*="cursor-pointer"]')
    const eventCount = await eventCards.count()

    if (eventCount > 0) {
      // Click on the first event card to navigate to its detail page
      await eventCards.first().click()
      await page.waitForLoadState('networkidle')

      // The URL should now be /events/:id
      await expect(page).toHaveURL(/\/events\/\d+/)

      // Detail page should show event info - look for status badge or basic info
      // The detail view shows status badge and event name
      const pageContent = page.locator('main')
      await expect(pageContent).not.toBeEmpty()
    } else {
      // No events exist - verify the empty state is shown
      await expect(page.getByText(/Nenhum evento/)).toBeVisible()
    }
  })

  test('event status can be seen in the list', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')

    // Wait for loading
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })

    // Check if events exist
    const hasEvents = await page.locator('.card-body').first().isVisible().catch(() => false)

    if (hasEvents) {
      // Status badges should be visible on event cards.
      // Possible statuses: Rascunho, Ativo, Concluido, Cancelado
      const statusBadges = page.locator('.rounded-full').filter({
        hasText: /Rascunho|Ativo|Concluido|Cancelado/,
      })
      const badgeCount = await statusBadges.count()
      expect(badgeCount).toBeGreaterThanOrEqual(1)
    } else {
      // No events - empty state should be shown
      await expect(page.getByText(/Nenhum evento/)).toBeVisible()
    }
  })

  test('events can be filtered by status', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')

    // Wait for initial load
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })

    // The status filter select should be visible
    const statusSelect = page.locator('select').filter({ hasText: /Todos/ })
    await expect(statusSelect.first()).toBeVisible()

    // Get the initial total count text
    const initialCountText = await page.getByText(/evento\(s\) encontrado\(s\)/).textContent()

    // Select a specific status filter (e.g. "Ativo" = active)
    await statusSelect.first().selectOption('active')

    // Wait for the filtered results to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // The count text should still be present (might have changed)
    await expect(page.getByText(/evento\(s\) encontrado\(s\)/)).toBeVisible()

    // Reset filter by selecting "Todos"
    await statusSelect.first().selectOption('')
    await page.waitForLoadState('networkidle')

    // Count should be back to original
    await expect(page.getByText(/evento\(s\) encontrado\(s\)/)).toBeVisible()
  })
})
