import { describe, it, expect, vi, beforeEach } from 'vitest'
import publicVendorsService from '@/services/publicVendors'
import api from '@/services/api'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

const dadosCadastro = {
  trade_name: 'Buffet Novo',
  cnpj: '11.222.333/0001-44',
  email: 'contato@buffetnovo.com.br',
  city: 'São Paulo',
  state: 'SP',
  contact_name: 'Maria',
  contact_email: 'maria@buffetnovo.com.br',
  contact_phone: '(11) 90000-0000',
  category_ids: ['cat-1'],
}

describe('publicVendorsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCategories', () => {
    it('busca as categorias do endpoint público', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [{ id: 'c1', name: 'Buffet' }] } })

      const categorias = await publicVendorsService.getCategories()

      expect(api.get).toHaveBeenCalledWith('/public/vendors/categories')
      expect(categorias).toHaveLength(1)
    })
  })

  describe('register', () => {
    it('envia o cadastro para o endpoint público', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { data: { id: 'v1', approval_status: 'pending' } },
      })

      const vendor = await publicVendorsService.register(dadosCadastro)

      expect(api.post).toHaveBeenCalledWith('/public/vendors/register', dadosCadastro)
      // O backend define approval_status; o formulário não envia esse campo.
      expect(vendor.approval_status).toBe('pending')
    })

    it('propaga o erro de validação para o formulário tratar', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: { status: 422, data: { errors: { cnpj: ['Este CNPJ já está cadastrado.'] } } },
      })

      await expect(publicVendorsService.register(dadosCadastro)).rejects.toMatchObject({
        response: { status: 422 },
      })
    })
  })

  describe('checkCnpj', () => {
    it.each([
      [true, 'Este CNPJ já está cadastrado.'],
      [false, undefined],
    ])('devolve exists=%s', async (exists, message) => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { exists, message } })

      const resultado = await publicVendorsService.checkCnpj('11.222.333/0001-44')

      expect(api.post).toHaveBeenCalledWith('/public/vendors/check-cnpj', {
        cnpj: '11.222.333/0001-44',
      })
      expect(resultado.exists).toBe(exists)
    })

    it('devolve a resposta inteira, e não `data.data`', async () => {
      // Diferente dos demais métodos: este endpoint responde no nível raiz.
      vi.mocked(api.post).mockResolvedValueOnce({ data: { exists: false } })

      expect(await publicVendorsService.checkCnpj('x')).toEqual({ exists: false })
    })
  })

  describe('checkEmail', () => {
    it('consulta o e-mail no endpoint correto', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { exists: true, message: 'Já cadastrado.' } })

      const resultado = await publicVendorsService.checkEmail('a@b.com')

      expect(api.post).toHaveBeenCalledWith('/public/vendors/check-email', { email: 'a@b.com' })
      expect(resultado.exists).toBe(true)
    })
  })
})
