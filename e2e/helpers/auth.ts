import { type Page } from '@playwright/test'

/**
 * Default test credentials for the Orchestra admin user.
 */
export const TEST_CREDENTIALS = {
  email: 'admin@orchestra.local',
  password: 'password',
} as const

/**
 * API base URL used by the backend.
 * The frontend proxies /api requests, but for direct API calls from test
 * helpers we go through the same origin the browser uses.
 */
const API_BASE = 'http://localhost:8001/api'

export interface AuthResponse {
  data: {
    token: string
    user: {
      id: number
      name: string
      email: string
      roles: string[]
      permissions: string[]
      organization?: Record<string, unknown>
    }
  }
}

/**
 * Logs in via the API and injects the auth token + user data into
 * localStorage so the Vue app recognises the session immediately.
 *
 * Call this in `beforeEach` for any test that requires an authenticated user.
 */
export async function loginViaApi(
  page: Page,
  credentials: { email: string; password: string } = TEST_CREDENTIALS,
): Promise<void> {
  // Hit the login endpoint directly
  const response = await page.request.post(`${API_BASE}/login`, {
    data: {
      email: credentials.email,
      password: credentials.password,
    },
  })

  if (!response.ok()) {
    throw new Error(
      `Login API returned ${response.status()}: ${await response.text()}`,
    )
  }

  const body: AuthResponse = await response.json()

  // Inject token and user into localStorage before navigating,
  // so the Vue router guard picks them up immediately.
  await page.addInitScript(
    ({ token, user }: { token: string; user: string }) => {
      window.localStorage.setItem('token', token)
      window.localStorage.setItem('user', user)
    },
    { token: body.data.token, user: JSON.stringify(body.data.user) },
  )
}

/**
 * Logs in by filling the login form in the browser.
 * Useful for tests that explicitly verify the login UI flow.
 */
export async function loginViaUI(
  page: Page,
  credentials: { email: string; password: string } = TEST_CREDENTIALS,
): Promise<void> {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  await page.fill('#email', credentials.email)
  await page.fill('#password', credentials.password)
  await page.click('button[type="submit"]')

  // Wait for navigation away from /login
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15_000,
  })
}

/**
 * Clears auth data from localStorage effectively logging out
 * without hitting the API.
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('user')
  })
}
