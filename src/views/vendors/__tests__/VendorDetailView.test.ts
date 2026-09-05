import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import VendorDetailView from '../VendorDetailView.vue'
import vendorsService from '@/services/vendors'

const push = vi.fn()
const toast = { success: vi.fn(), error: vi.fn() }

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'v1' } }),
  useRouter: () => ({ push }),
}))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))
vi.mock('@/services/vendors', () => ({
  default: {
    get: vi.fn(), getCompliance: vi.fn(), approve: vi.fn(), reject: vi.fn(),
    toggleActive: vi.fn(), delete: vi.fn(), verify: vi.fn(),
  },
}))

const fornecedor = (over = {}) => ({
  id: 'v1', trade_name: 'Energia Total', legal_name: 'Energia Total Ltda',
  cnpj: '67.890.123/0001-06', email: 'contato@energiatotal.com.br',
  phone: '(11) 7890-1234', city: 'Guarulhos', state: 'SP',
  address: 'Av. Industrial, 1500', zip_code: '07190-000',
  description: 'Locação de geradores.', service_radius_km: 120,
  is_active: true, is_verified: true, approval_status: 'approved',
  subscription_tier: 'free', average_rating: 4.8, total_ratings: 42,
  categories: [{ id: 'c1', name: 'Geradores e Energia', icon: 'bolt' }],
  accepts_urgent: true, created_at: '2026-09-02T00:00:00Z',
  updated_at: '2026-09-02T00:00:00Z', approved_at: '2026-09-02T00:00:00Z',
  ...over,
})

const compliance = (over = {}) => ({
  is_compliant: false,
  documents: {
    cnpj_card: { label: 'Cartão CNPJ', status: 'missing', uploaded_at: null, expiry_date: null, is_expired: false },
    alvara: { label: 'Alvará de Funcionamento', status: 'missing', uploaded_at: null, expiry_date: null, is_expired: false },
  },
  total_documents: 0,
  ...over,
})

const montar = async () => {
  const wrapper = mount(VendorDetailView, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
  await flushPromises()
  return wrapper
}

describe('VendorDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(vendorsService.get).mockResolvedValue(fornecedor() as never)
    vi.mocked(vendorsService.getCompliance).mockResolvedValue(compliance() as never)
  })

  it('exibe os dados do fornecedor', async () => {
    const w = await montar()

    expect(vendorsService.get).toHaveBeenCalledWith('v1')
    expect(w.text()).toContain('Energia Total')
    expect(w.text()).toContain('67.890.123/0001-06')
    expect(w.text()).toContain('Guarulhos')
  })

  it('exibe a categoria com ícone renderizado', async () => {
    const w = await montar()

    expect(w.text()).toContain('Geradores e Energia')
    // O nome do ícone não pode vazar como texto.
    expect(w.text()).not.toContain('bolt')
  })

  describe('compliance', () => {
    it('lista os documentos exigidos com rótulo em português', async () => {
      const w = await montar()

      expect(w.text()).toContain('Cartão CNPJ')
      expect(w.text()).toContain('Alvará de Funcionamento')
      expect(w.text()).toContain('Não enviado')
    })

    it('não imprime o JSON cru do payload', async () => {
      // Regressão: o template testava Array.isArray(documents) e caía num dump
      // genérico, mostrando o objeto serializado e rótulos em inglês.
      const w = await montar()

      expect(w.text()).not.toContain('is_expired')
      expect(w.text()).not.toContain('uploaded_at')
      expect(w.text()).not.toContain('IS COMPLIANT')
    })

    it('mostra a situação como pendências quando falta documento', async () => {
      const w = await montar()

      expect(w.text()).toContain('Pendências')
      expect(w.text()).toContain('0 de 2')
    })

    it('mostra em conformidade quando tudo está válido', async () => {
      vi.mocked(vendorsService.getCompliance).mockResolvedValueOnce(compliance({
        is_compliant: true,
        documents: {
          cnpj_card: { label: 'Cartão CNPJ', status: 'valid', uploaded_at: '2026-01-01', expiry_date: null, is_expired: false },
        },
      }) as never)

      const w = await montar()

      expect(w.text()).toContain('Em conformidade')
      expect(w.text()).toContain('Válido')
    })

    it('marca documento vencido mesmo com status aprovado', async () => {
      vi.mocked(vendorsService.getCompliance).mockResolvedValueOnce(compliance({
        documents: {
          alvara: { label: 'Alvará', status: 'approved', uploaded_at: '2025-01-01', expiry_date: '2025-12-31', is_expired: true },
        },
      }) as never)

      const w = await montar()

      expect(w.text()).toContain('Vencido')
    })

    it('sobrevive quando o compliance não carrega', async () => {
      vi.mocked(vendorsService.getCompliance).mockRejectedValueOnce(new Error('404'))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const w = await montar()

      // A tela do fornecedor continua útil sem o bloco de compliance.
      expect(w.text()).toContain('Energia Total')
    })
  })

  describe('aprovação', () => {
    it('oferece aprovar e rejeitar quando pendente', async () => {
      vi.mocked(vendorsService.get).mockResolvedValueOnce(
        fornecedor({ approval_status: 'pending' }) as never,
      )

      const w = await montar()

      expect(w.text()).toContain('Aprovar')
      expect(w.text()).toContain('Rejeitar')
    })

    it('não oferece aprovar quando já aprovado', async () => {
      const w = await montar()

      expect(w.text()).not.toContain('Rejeitar Fornecedor')
    })
  })
})
