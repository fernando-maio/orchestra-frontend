import { defineConfig, devices } from '@playwright/test'
import { STORAGE_STATE } from './e2e/helpers/auth'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  outputDir: 'test-results/',

  projects: [
    // Faz um unico login e grava a sessao em e2e/.auth/admin.json.
    // Sem isso, cada teste logava no beforeEach e a suite estourava o rate
    // limit de 5 req/min do /api/login, recebendo 429 a partir do sexto teste.
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],
})
