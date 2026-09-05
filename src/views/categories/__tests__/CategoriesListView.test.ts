import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import CategoriesListView from '../CategoriesListView.vue'
import api from '@/services/api'

const toast = { success: vi.fn(), error: vi.fn() }
vi.mock('vue-toastification', () => ({ useToast: () => toast }))
vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const categoria = (over = {}) => ({
  id: 'c1', name: 'Buffet e Alimentação', slug: 'buffet',
  description: 'Serviços de alimentação', icon: 'utensils', color: '#FF6B6B',
  is_active: true, vendors_count: 3,
  ...over,
})

const montar = async (permissions: string[]) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useAuthStore()
  store.user = {
    id: 'u1', name: 'T', email: 't@e.com', organization_id: 'o1',
    is_active: true, organization: null, roles: ['admin'], permissions,
  } as never
  store.token = 'tok'

  const wrapper = mount(CategoriesListView, { global: { plugins: [pinia] } })
  await flushPromises()
  return wrapper
}

describe('CategoriesListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: { data: [categoria()] } })
  })

  describe('contagem de fornecedores', () => {
    it('mostra a contagem vinda da API', async () => {
      // Regressão: a API não devolvia vendors_count e o template caía no
      // fallback `|| 0`, então TODA categoria aparecia com "0 fornecedores"
      // mesmo havendo vínculo no banco.
      const w = await montar(['categories.update'])

      expect(w.text()).toContain('3 fornecedores')
    })

    it('usa o singular para uma única categoria com um fornecedor', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { data: [categoria({ vendors_count: 1 })] },
      })

      const w = await montar(['categories.update'])

      expect(w.text()).toContain('1 fornecedor')
      expect(w.text()).not.toContain('1 fornecedores')
    })

    it('mostra zero para categoria sem fornecedor', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { data: [categoria({ vendors_count: 0 })] },
      })

      const w = await montar(['categories.update'])

      expect(w.text()).toContain('0 fornecedores')
    })

    it('não quebra quando o campo não vem', async () => {
      // whenCounted omite o campo nas rotas que não contam.
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { data: [categoria({ vendors_count: undefined })] },
      })

      const w = await montar(['categories.update'])

      expect(w.text()).toContain('0 fornecedores')
      expect(w.text()).not.toContain('undefined')
    })
  })

  describe('ícone', () => {
    it('renderiza um SVG e não o nome do ícone', async () => {
      const w = await montar(['categories.update'])

      expect(w.find('svg').exists()).toBe(true)
      expect(w.text()).not.toContain('utensils')
    })
  })

  describe('permissão de edição', () => {
    it('habilita o toggle para quem tem categories.update', async () => {
      const w = await montar(['categories.update'])

      expect(w.find('button[title]').attributes('disabled')).toBeUndefined()
    })

    it('desabilita o toggle para quem não tem', async () => {
      // Categorias são dado da plataforma: só o super-admin altera. Sem o
      // gate, admin e organizer viam o botão e levavam 403.
      const w = await montar(['categories.view'])

      expect(w.find('button[title]').attributes('disabled')).toBeDefined()
      expect(w.find('button[title]').attributes('title')).toContain('plataforma')
    })
  })
})
