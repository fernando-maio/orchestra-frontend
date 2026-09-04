import { test as setup, expect } from '@playwright/test'
import { STORAGE_STATE, seedAuthenticatedSession } from './helpers/auth'

/**
 * Faz o unico login da suite e grava a sessao em disco. Todos os projetos
 * que dependem de `setup` carregam esse estado via `storageState`.
 */
setup('autentica e grava o storage state', async ({ page }) => {
  const body = await seedAuthenticatedSession(page)

  expect(body.data.token).toBeTruthy()

  await page.context().storageState({ path: STORAGE_STATE })
})
