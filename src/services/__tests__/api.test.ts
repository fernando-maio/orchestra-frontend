import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Os interceptors do axios são registrados no import do módulo. Para testá-los
 * é preciso capturar os handlers no momento do registro — daí o mock de
 * `axios.create` devolvendo um objeto que guarda o que foi registrado.
 */
type Handler = (arg: unknown) => unknown

const registrados: {
  request?: { ok: Handler; erro: Handler }
  response?: { ok: Handler; erro: Handler }
} = {}

vi.mock('axios', () => ({
  default: {
    create: () => ({
      interceptors: {
        request: {
          use: (ok: Handler, erro: Handler) => { registrados.request = { ok, erro } },
        },
        response: {
          use: (ok: Handler, erro: Handler) => { registrados.response = { ok, erro } },
        },
      },
    }),
  },
}))

describe('interceptors do api', () => {
  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    await import('@/services/api')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('requisição', () => {
    it('injeta o Bearer token quando há sessão', () => {
      localStorage.setItem('token', 'tok-123')

      const config = registrados.request!.ok({ headers: {} }) as { headers: Record<string, string> }

      expect(config.headers.Authorization).toBe('Bearer tok-123')
    })

    it('não injeta cabeçalho quando não há token', () => {
      const config = registrados.request!.ok({ headers: {} }) as { headers: Record<string, string> }

      expect(config.headers.Authorization).toBeUndefined()
    })

    it('repassa o erro de requisição sem alterar', async () => {
      const erro = new Error('falha antes de enviar')

      await expect(registrados.request!.erro(erro)).rejects.toBe(erro)
    })
  })

  describe('resposta', () => {
    it('devolve a resposta intacta no caminho feliz', () => {
      const resposta = { data: { ok: true } }

      expect(registrados.response!.ok(resposta)).toBe(resposta)
    })

    it('limpa a sessão e manda para o login no 401', async () => {
      // Comportamento crítico: token expirado precisa derrubar a sessão local,
      // senão o app fica num estado "logado" que a API recusa.
      localStorage.setItem('token', 'expirado')
      localStorage.setItem('user', '{"id":"1"}')

      await expect(
        registrados.response!.erro({ response: { status: 401 } }),
      ).rejects.toBeDefined()

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(window.location.href).toBe('/login')
    })

    it('não derruba a sessão em erros que não são 401', async () => {
      localStorage.setItem('token', 'valido')

      await expect(
        registrados.response!.erro({ response: { status: 500 } }),
      ).rejects.toBeDefined()

      expect(localStorage.getItem('token')).toBe('valido')
    })

    it('mantém a sessão no 403 de assinatura inativa', async () => {
      // 403 não é sessão inválida: o usuário está autenticado, mas a
      // organização está com a assinatura suspensa.
      const aviso = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorage.setItem('token', 'valido')

      await expect(
        registrados.response!.erro({
          response: { status: 403, data: { message: 'subscription inactive' } },
        }),
      ).rejects.toBeDefined()

      expect(localStorage.getItem('token')).toBe('valido')
      expect(aviso).toHaveBeenCalled()
    })

    it('sobrevive a erro de rede, sem response', async () => {
      await expect(
        registrados.response!.erro({ message: 'Network Error' }),
      ).rejects.toBeDefined()
    })
  })
})
