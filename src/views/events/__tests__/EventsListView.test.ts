import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import EventsListView from '../EventsListView.vue'
import eventsService from '@/services/events'
import dashboardService from '@/services/dashboard'

const push = vi.fn()
const toast = { success: vi.fn(), error: vi.fn() }

vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))
vi.mock('@/services/events', () => ({
  default: {
    list: vi.fn(), delete: vi.fn(), duplicate: vi.fn(), updateStatus: vi.fn(),
  },
}))
vi.mock('@/services/dashboard', () => ({
  default: { getTopOrganizations: vi.fn() },
}))

const evento = (over = {}) => ({
  id: 'e1', name: 'Conferência Tech', status: 'active',
  start_date: '2026-10-02', end_date: '2026-10-03',
  city: 'São Paulo', state: 'SP', venue_name: 'Centro de Convenções',
  estimated_budget: 250000, expected_attendees: 500,
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

  const wrapper = mount(EventsListView, { global: { plugins: [pinia] } })
  await flushPromises()
  return { wrapper, store }
}

const TODAS = ['events.view', 'events.create', 'events.update', 'events.delete']

describe('EventsListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(eventsService.list).mockResolvedValue({
      data: [evento()],
      meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
    } as never)
    vi.mocked(dashboardService.getTopOrganizations).mockResolvedValue([] as never)
  })

  describe('listagem', () => {
    it('carrega e exibe os eventos', async () => {
      const { wrapper } = await montar(TODAS)

      expect(eventsService.list).toHaveBeenCalled()
      expect(wrapper.text()).toContain('Conferência Tech')
      expect(wrapper.text()).toContain('1 evento(s) encontrado(s)')
    })

    it('mostra o estado vazio quando não há eventos', async () => {
      vi.mocked(eventsService.list).mockResolvedValueOnce({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 15 },
      } as never)

      const { wrapper } = await montar(TODAS)

      expect(wrapper.text()).toContain('Nenhum evento')
    })

    it('avisa quando a listagem falha, em vez de ficar em branco', async () => {
      vi.mocked(eventsService.list).mockRejectedValueOnce(new Error('rede'))

      await montar(TODAS)

      expect(toast.error).toHaveBeenCalled()
    })
  })

  describe('filtro por organização', () => {
    it('aparece e é carregado para o super-admin', async () => {
      vi.mocked(dashboardService.getTopOrganizations).mockResolvedValueOnce([
        { id: 'o1', name: 'Empresa Demo' },
      ] as never)

      const { wrapper } = await montar(TODAS, ['super-admin'])

      expect(dashboardService.getTopOrganizations).toHaveBeenCalled()
      expect(wrapper.text()).toContain('Organização')
      expect(wrapper.text()).toContain('Empresa Demo')
    })

    it('não aparece para quem não é super-admin', async () => {
      // O global scope prende o usuário à própria organização: o filtro seria
      // uma caixa com uma opção só.
      const { wrapper } = await montar(TODAS, ['admin'])

      expect(wrapper.text()).not.toContain('Organização')
      expect(dashboardService.getTopOrganizations).not.toHaveBeenCalled()
    })
  })

  describe('permissões', () => {
    it('mostra "Novo Evento" para quem pode criar', async () => {
      const { wrapper } = await montar(TODAS)

      expect(wrapper.text()).toContain('Novo Evento')
    })

    it('esconde "Novo Evento" de quem só visualiza', async () => {
      const { wrapper } = await montar(['events.view'])

      expect(wrapper.text()).not.toContain('Novo Evento')
    })

    it('esconde o botão de excluir de quem não tem events.delete', async () => {
      const semDelete = await montar(['events.view', 'events.update'])
      const comDelete = await montar(TODAS)

      const contar = (w: { html: () => string }) =>
        (w.html().match(/hover:text-red-600/g) ?? []).length

      expect(contar(semDelete.wrapper)).toBe(0)
      expect(contar(comDelete.wrapper)).toBeGreaterThan(0)
    })
  })

  describe('ações', () => {
    it('duplicar cria um evento novo e recarrega a lista', async () => {
      vi.mocked(eventsService.duplicate).mockResolvedValueOnce(evento({ id: 'e2' }) as never)
      const { wrapper } = await montar(TODAS)

      const botoes = wrapper.findAll('button')
      const duplicar = botoes.find(b => b.attributes('title')?.includes('Duplicar'))
      await duplicar?.trigger('click')
      await flushPromises()

      expect(eventsService.duplicate).toHaveBeenCalledWith('e1')
      expect(toast.success).toHaveBeenCalled()
    })
  })
})
