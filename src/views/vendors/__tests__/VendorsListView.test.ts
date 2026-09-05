import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import VendorsListView from '../VendorsListView.vue'
import vendorsService from '@/services/vendors'

const push = vi.fn()
const toast = { success: vi.fn(), error: vi.fn() }

vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))
vi.mock('@/services/vendors', () => ({
  default: {
    list: vi.fn(), delete: vi.fn(), toggleActive: vi.fn(), approve: vi.fn(),
    reject: vi.fn(), getCategories: vi.fn(), updateSubscriptionTier: vi.fn(),
  },
}))

const fornecedor = (over = {}) => ({
  id: 'v1', trade_name: 'Delícias Buffet', legal_name: 'Delícias Ltda',
  email: 'contato@delicias.com.br', cnpj: '12.345.678/0001-01',
  city: 'São Paulo', state: 'SP', is_active: true, is_verified: true,
  approval_status: 'approved', subscription_tier: 'free',
  average_rating: 3.6, total_ratings: 33, categories: [],
  ...over,
})

const montar = async (permissions: string[], roles = ['admin']) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useAuthStore()
  store.user = {
    id: 'u1', name: 'T', email: 't@e.com', organization_id: 'o1',
    is_active: true, organization: null, roles, permissions,
  } as never
  store.token = 'tok'

  const wrapper = mount(VendorsListView, { global: { plugins: [pinia] } })
  await flushPromises()
  return { wrapper }
}

const TODAS = ['vendors.view', 'vendors.create', 'vendors.update', 'vendors.delete', 'vendors.approve']

describe('VendorsListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(vendorsService.list).mockResolvedValue({
      data: [fornecedor()],
      meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
    } as never)
    vi.mocked(vendorsService.getCategories).mockResolvedValue([] as never)
  })

  describe('listagem', () => {
    it('carrega e exibe os fornecedores', async () => {
      const { wrapper } = await montar(TODAS)

      expect(wrapper.text()).toContain('Delícias Buffet')
      expect(wrapper.text()).toContain('1 fornecedor(es) encontrado(s)')
    })

    it('mostra o estado vazio', async () => {
      vi.mocked(vendorsService.list).mockResolvedValueOnce({
        data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 15 },
      } as never)

      const { wrapper } = await montar(TODAS)

      expect(wrapper.text()).toContain('Nenhum fornecedor')
    })
  })

  describe('plano de patrocínio', () => {
    it('mostra o seletor para quem pode editar', async () => {
      const { wrapper } = await montar(TODAS)

      expect(wrapper.find('select[aria-label^="Plano de"]').exists()).toBe(true)
    })

    it('mostra apenas o badge para quem não pode editar', async () => {
      // Sem o fallback a coluna ficaria vazia, e o plano some da tela.
      const { wrapper } = await montar(['vendors.view'])

      expect(wrapper.find('select[aria-label^="Plano de"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('Free')
    })

    it('envia a troca de plano ao servidor', async () => {
      vi.mocked(vendorsService.updateSubscriptionTier).mockResolvedValueOnce(
        fornecedor({ subscription_tier: 'premium' }) as never,
      )
      const { wrapper } = await montar(TODAS)

      await wrapper.find('select[aria-label^="Plano de"]').setValue('premium')
      await flushPromises()

      expect(vendorsService.updateSubscriptionTier).toHaveBeenCalledWith('v1', 'premium')
      expect(toast.success).toHaveBeenCalled()
    })

    it('reverte o seletor quando o servidor recusa', async () => {
      // Sem o rollback o seletor mostraria um plano que não foi salvo.
      vi.mocked(vendorsService.updateSubscriptionTier).mockRejectedValueOnce({
        response: { data: { message: 'Sem permissão.' } },
      })
      const { wrapper } = await montar(TODAS)

      await wrapper.find('select[aria-label^="Plano de"]').setValue('premium')
      await flushPromises()

      expect(toast.error).toHaveBeenCalledWith('Sem permissão.')
      const select = wrapper.find('select[aria-label^="Plano de"]').element as HTMLSelectElement
      expect(select.value).toBe('free')
    })
  })

  describe('permissões', () => {
    it('mostra "Novo Fornecedor" para quem pode criar', async () => {
      const { wrapper } = await montar(TODAS)
      expect(wrapper.text()).toContain('Novo Fornecedor')
    })

    it('esconde "Novo Fornecedor" de quem só visualiza', async () => {
      const { wrapper } = await montar(['vendors.view'])
      expect(wrapper.text()).not.toContain('Novo Fornecedor')
    })

    it('só oferece aprovar/rejeitar para fornecedor pendente', async () => {
      vi.mocked(vendorsService.list).mockResolvedValueOnce({
        data: [fornecedor({ approval_status: 'pending' })],
        meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
      } as never)

      const { wrapper } = await montar(TODAS)
      const titulos = wrapper.findAll('button').map(b => b.attributes('title'))

      expect(titulos).toContain('Aprovar')
      expect(titulos).toContain('Rejeitar')
    })

    it('não oferece aprovar para fornecedor já aprovado', async () => {
      const { wrapper } = await montar(TODAS)
      const titulos = wrapper.findAll('button').map(b => b.attributes('title'))

      expect(titulos).not.toContain('Aprovar')
    })

    it('esconde aprovar de quem não tem vendors.approve', async () => {
      vi.mocked(vendorsService.list).mockResolvedValueOnce({
        data: [fornecedor({ approval_status: 'pending' })],
        meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
      } as never)

      const { wrapper } = await montar(['vendors.view', 'vendors.update'])
      const titulos = wrapper.findAll('button').map(b => b.attributes('title'))

      expect(titulos).not.toContain('Aprovar')
    })
  })
})
