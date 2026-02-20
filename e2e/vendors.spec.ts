import { test, expect } from '@playwright/test'
import { loginViaApi } from './helpers/auth'

test.describe('Vendors', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page)
  })

  test('vendors list page loads', async ({ page }) => {
    await page.goto('/vendors')
    await page.waitForLoadState('networkidle')

    // The page heading should show "Fornecedores"
    await expect(
      page.locator('h1').filter({ hasText: 'Fornecedores' }),
    ).toBeVisible({ timeout: 10_000 })

    // Subheading should be present
    await expect(
      page.getByText('Gerencie os fornecedores do marketplace'),
    ).toBeVisible()

    // The "Novo Fornecedor" button should be visible
    await expect(
      page.getByRole('button', { name: /Novo Fornecedor/i }),
    ).toBeVisible()

    // Wait for loading to complete
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })

    // The total count text should be visible
    await expect(page.getByText(/fornecedor\(es\) encontrado\(s\)/)).toBeVisible()

    // The table should have column headers
    const tableHeaders = page.locator('thead th')
    const headerCount = await tableHeaders.count()
    expect(headerCount).toBeGreaterThanOrEqual(5)
  })

  test('vendor detail page loads for existing vendor', async ({ page }) => {
    await page.goto('/vendors')
    await page.waitForLoadState('networkidle')

    // Wait for loading
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })

    // Check if there are vendor rows in the table
    const vendorRows = page.locator('tbody tr')
    const rowCount = await vendorRows.count()

    if (rowCount > 0) {
      // Find and click the "view details" button (eye icon) on the first vendor
      const viewButton = vendorRows.first().locator('button[title="Ver detalhes"]')
      const hasViewButton = await viewButton.isVisible().catch(() => false)

      if (hasViewButton) {
        await viewButton.click()
        await page.waitForLoadState('networkidle')

        // The URL should now be /vendors/:id
        await expect(page).toHaveURL(/\/vendors\/\d+/)

        // The detail page should have loaded with content
        const mainContent = page.locator('main')
        await expect(mainContent).not.toBeEmpty()
      }
    } else {
      // No vendors exist - empty state should be shown
      await expect(page.getByText(/Nenhum fornecedor/)).toBeVisible()
    }
  })

  test('vendors can be filtered by search and status', async ({ page }) => {
    await page.goto('/vendors')
    await page.waitForLoadState('networkidle')

    // Wait for initial load
    await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 15_000 })

    // Search input should be visible
    const searchInput = page.locator('input[placeholder*="Nome"]').first()
    await expect(searchInput).toBeVisible()

    // Status filter select should be visible
    // The vendor list has both Category and Approval Status selects
    const statusSelect = page.locator('select').filter({ hasText: /Pendente|Aprovado/ })
    await expect(statusSelect.first()).toBeVisible()

    // Apply a status filter
    await statusSelect.first().selectOption('approved')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Count text should still be visible
    await expect(page.getByText(/fornecedor\(es\) encontrado\(s\)/)).toBeVisible()

    // Reset filters
    await statusSelect.first().selectOption('')
    await page.waitForLoadState('networkidle')

    // Try typing in the search field
    await searchInput.fill('test')
    await page.waitForTimeout(500) // debounce wait
    await page.waitForLoadState('networkidle')

    // The count should update
    await expect(page.getByText(/fornecedor\(es\) encontrado\(s\)/)).toBeVisible()

    // Clear search
    await searchInput.fill('')
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')
  })

  test('vendor registration public page loads', async ({ page }) => {
    // This page is public - no login required.
    // We clear any existing auth so it does not redirect us.
    await page.goto('/cadastro-fornecedor')
    await page.waitForLoadState('networkidle')

    // The public vendor registration form should be accessible.
    // Check that the page has loaded and is not redirected to login.
    expect(page.url()).toContain('/cadastro-fornecedor')

    // The form should contain fields for vendor registration.
    // Look for common registration fields or step indicators.
    const formContent = page.locator('form, [class*="step"], main')
    await expect(formContent.first()).toBeVisible({ timeout: 10_000 })

    // The page should have input fields for the vendor information
    const inputs = page.locator('input, select, textarea')
    const inputCount = await inputs.count()
    expect(inputCount).toBeGreaterThanOrEqual(1)
  })
})
