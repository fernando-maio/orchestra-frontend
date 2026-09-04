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
export const API_BASE = 'http://localhost:8001/api'

/**
 * Onde o projeto `setup` grava a sessao autenticada. Os demais projetos
 * carregam esse arquivo via `storageState`, de modo que a suite inteira
 * faz UM unico login.
 *
 * Isso existe por causa do rate limit de 5 req/min no /api/login: com um
 * login por teste a suite estourava o limite e os testes a partir do sexto
 * recebiam 429 (HTML "Too Many Requests") em vez do JSON esperado.
 */
export const STORAGE_STATE = 'e2e/.auth/admin.json'

export interface AuthResponse {
  data: {
    token: string
    user: {
      id: string
      name: string
      email: string
      roles: string[]
      permissions: string[]
      organization?: Record<string, unknown> | null
    }
  }
}

/**
 * Autentica pela API e grava token + usuario no localStorage da pagina.
 *
 * Usado apenas pelo projeto `setup`. Os testes nao chamam isso: eles herdam
 * a sessao pronta via `storageState`.
 *
 * Escreve com `page.evaluate` e nao com `page.addInitScript` de proposito.
 * O `addInitScript` roda de novo a cada navegacao, o que tornava impossivel
 * encerrar a sessao dentro de um teste: qualquer `page.goto` reinjetava o
 * token logo apos o `clearAuth`.
 */
export async function seedAuthenticatedSession(
  page: Page,
  credentials: { email: string; password: string } = TEST_CREDENTIALS,
): Promise<AuthResponse> {
  const response = await page.request.post(`${API_BASE}/login`, {
    data: credentials,
  })

  if (!response.ok()) {
    throw new Error(
      `Login API returned ${response.status()}: ${await response.text()}`,
    )
  }

  const body: AuthResponse = await response.json()

  // O localStorage e por origem, entao precisamos de um documento carregado
  // na origem do app antes de escrever nele.
  await page.goto('/login')
  await page.evaluate(
    ({ token, user }: { token: string; user: string }) => {
      window.localStorage.setItem('token', token)
      window.localStorage.setItem('user', user)
    },
    { token: body.data.token, user: JSON.stringify(body.data.user) },
  )

  return body
}

/**
 * Faz login preenchendo o formulario, exercitando a UI de verdade.
 * Use apenas no teste que valida o fluxo de login em si.
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
 * Limpa a sessao do localStorage, equivalente a um logout.
 */
export async function clearAuth(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('user')
  })
}
