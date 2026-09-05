import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import EventFormView from '../EventFormView.vue'
import eventsService from '@/services/events'
import vendorsService from '@/services/vendors'

const push = vi.fn()
const toast = { success: vi.fn(), error: vi.fn() }
const params: Record<string, string | undefined> = {}

vi.mock('vue-router', () => ({ useRoute: () => ({ params }), useRouter: () => ({ push }) }))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))
vi.mock('@/services/events', () => ({
  default: { get: vi.fn(), create: vi.fn(), update: vi.fn() },
}))
vi.mock('@/services/vendors', () => ({ default: { getCategories: vi.fn() } }))

const evento = () => ({
  id: 'e1', name: 'Conferência Tech 2026', description: 'Evento anual',
  start_date: '2026-10-02', end_date: '2026-10-03',
  estimated_budget: 250000, expected_attendees: 500,
  venue_name: 'Centro de Convenções', address: 'Av. Paulista, 1000',
  city: 'São Paulo', state: 'SP', zip_code: '01310-100', status: 'active',
})

const montar = async () => {
  const w = mount(EventFormView, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
  await flushPromises()
  return w
}

describe('EventFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete params.id
    vi.mocked(vendorsService.getCategories).mockResolvedValue([] as never)
  })

  describe('criação', () => {
    it('abre vazio e não busca evento', async () => {
      const w = await montar()

      expect(eventsService.get).not.toHaveBeenCalled()
      expect((w.find('#name').element as HTMLInputElement).value).toBe('')
    })

    it('cria o evento com os dados preenchidos', async () => {
      vi.mocked(eventsService.create).mockResolvedValueOnce(evento() as never)
      const w = await montar()

      await w.find('#name').setValue('Novo Evento')
      await w.find('#start_date').setValue('2026-12-01')
      await w.find('#address').setValue('Rua X, 1')
      await w.find('#city').setValue('São Paulo')
      await w.find('#state').setValue('SP')
      await w.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(eventsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Novo Evento' }),
      )
      expect(toast.success).toHaveBeenCalled()
    })

    it('marca os campos obrigatórios com required', async () => {
      // Diferente do VendorFormView, que tem uma função validate() em JS com
      // mensagens em português, esta tela depende do `required` do HTML5. No
      // navegador os dois bloqueiam o envio, mas as mensagens são diferentes:
      // aqui vêm do browser, lá do app. Inconsistência conhecida.
      const w = await montar()

      expect(w.find('#name').attributes('required')).toBeDefined()
      expect(w.find('#start_date').attributes('required')).toBeDefined()
      expect(w.find('#city').attributes('required')).toBeDefined()
    })
  })

  describe('edição', () => {
    beforeEach(() => {
      params.id = 'e1'
      vi.mocked(eventsService.get).mockResolvedValue(evento() as never)
    })

    it('carrega e preenche o evento', async () => {
      const w = await montar()

      expect(eventsService.get).toHaveBeenCalledWith('e1')
      expect((w.find('#name').element as HTMLInputElement).value).toBe('Conferência Tech 2026')
    })

    it('chama update em vez de create', async () => {
      vi.mocked(eventsService.update).mockResolvedValueOnce(evento() as never)
      const w = await montar()

      await w.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(eventsService.update).toHaveBeenCalledWith('e1', expect.anything())
      expect(eventsService.create).not.toHaveBeenCalled()
    })

    it('mostra erro de validação da API', async () => {
      vi.mocked(eventsService.update).mockRejectedValueOnce({
        response: { status: 422, data: { errors: { start_date: ['Data inválida.'] } } },
      })
      const w = await montar()

      await w.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(w.text()).toContain('Data inválida.')
    })
  })
})
