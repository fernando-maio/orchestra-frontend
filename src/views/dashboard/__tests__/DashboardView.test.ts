import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import DashboardView from '../DashboardView.vue'
import dashboardService from '@/services/dashboard'

vi.mock('@/services/dashboard', () => ({
  default: {
    getDashboard: vi.fn(), getBudgetOverview: vi.fn(), getProposalsByStatus: vi.fn(),
    getSpendingByCategory: vi.fn(), getSpendingHistory: vi.fn(),
  },
}))
// Os gráficos ApexCharts precisam de canvas, que o jsdom não tem.
vi.mock('vue3-apexcharts', () => ({ default: { template: '<div class="apexchart-stub" />' } }))

const eventoOrcamento = (over = {}) => ({
  id: 'e1', name: 'Conferência Tech', estimated_budget: 10000,
  spent: 4000, remaining: 6000, over_amount: 0,
  percentage: 40, percentage_real: 40, status: 'ok',
  ...over,
})

const totais = (over = {}) => ({
  total_budget: 10000, total_spent: 4000, savings: 6000,
  over_amount: 0, percentage: 40, percentage_real: 40, over_budget_count: 0,
  ...over,
})

const montarCom = async (budget: unknown) => {
  vi.mocked(dashboardService.getBudgetOverview).mockResolvedValue(budget as never)

  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useAuthStore()
  store.user = {
    id: 'u1', name: 'Demo', email: 'd@e.com', organization_id: 'o1',
    is_active: true, organization: { id: 'o1', name: 'Empresa Demo' },
    roles: ['admin'], permissions: [],
  } as never
  store.token = 'tok'

  const wrapper = mount(DashboardView, {
    global: { plugins: [pinia], stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
  await flushPromises()
  return wrapper
}

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dashboardService.getDashboard).mockResolvedValue({
      stats: {
        active_events: 3, total_vendors: 10, open_quotes: 2, pending_proposals: 1,
        events_this_month: 1, active_budget: 50000, verified_vendors: 8, response_rate: 75,
      },
      upcoming_events: [], top_vendors: [],
    } as never)
    vi.mocked(dashboardService.getProposalsByStatus).mockResolvedValue([] as never)
    vi.mocked(dashboardService.getSpendingByCategory).mockResolvedValue({ categories: [], total: 0 } as never)
    vi.mocked(dashboardService.getSpendingHistory).mockResolvedValue([] as never)
  })

  it('carrega os cinco blocos do dashboard em paralelo', async () => {
    await montarCom({ events: [eventoOrcamento()], totals: totais() })

    expect(dashboardService.getDashboard).toHaveBeenCalled()
    expect(dashboardService.getBudgetOverview).toHaveBeenCalled()
    expect(dashboardService.getProposalsByStatus).toHaveBeenCalled()
    expect(dashboardService.getSpendingByCategory).toHaveBeenCalled()
    expect(dashboardService.getSpendingHistory).toHaveBeenCalledWith(12)
  })

  it('exibe as métricas principais', async () => {
    const w = await montarCom({ events: [eventoOrcamento()], totals: totais() })

    expect(w.text()).toContain('Eventos Ativos')
  })

  describe('aviso de orçamento', () => {
    it('alerta com o valor excedido quando um evento estoura', async () => {
      // Este alerta existia no código mas era inalcançável: filtrava por
      // status 'over_budget', que o backend nunca devolvia.
      const w = await montarCom({
        events: [eventoOrcamento({ spent: 25000, over_amount: 15000, status: 'over_budget' })],
        totals: totais({ over_budget_count: 1 }),
      })

      expect(w.text()).toContain('1 evento(s) acima do orçamento')
      expect(w.text()).toContain('15.000')
    })

    it('soma o excedente de vários eventos estourados', async () => {
      const w = await montarCom({
        events: [
          eventoOrcamento({ id: 'a', over_amount: 5000, status: 'over_budget' }),
          eventoOrcamento({ id: 'b', over_amount: 3000, status: 'over_budget' }),
        ],
        totals: totais({ over_budget_count: 2 }),
      })

      expect(w.text()).toContain('2 evento(s) acima do orçamento')
      expect(w.text()).toContain('8.000')
    })

    it('avisa sobre eventos próximos do limite', async () => {
      const w = await montarCom({
        events: [eventoOrcamento({ spent: 9000, percentage: 90, status: 'warning' })],
        totals: totais(),
      })

      expect(w.text()).toContain('próximo(s) do limite')
    })

    it('mostra economia potencial quando tudo está dentro do orçamento', async () => {
      const w = await montarCom({ events: [eventoOrcamento()], totals: totais() })

      expect(w.text()).toContain('Economia potencial')
    })
  })

  describe('card de totais', () => {
    it('mostra "Disponível" quando há saldo', async () => {
      const w = await montarCom({ events: [eventoOrcamento()], totals: totais() })

      expect(w.text()).toContain('Disponível')
      expect(w.text()).not.toContain('Excedido')
    })

    it('troca para "Excedido" quando o agregado estoura', async () => {
      // Antes mostrava "Disponível: R$ 0", escondendo o problema.
      const w = await montarCom({
        events: [eventoOrcamento({ status: 'over_budget', over_amount: 20000 })],
        totals: totais({ savings: 0, over_amount: 20000, over_budget_count: 1 }),
      })

      expect(w.text()).toContain('Excedido')
      expect(w.text()).toContain('20.000')
    })
  })

  it('não quebra quando a API falha', async () => {
    vi.mocked(dashboardService.getDashboard).mockRejectedValueOnce(new Error('rede'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const w = await montarCom({ events: [], totals: totais() })

    // Sai do carregamento e renderiza a estrutura, em vez de ficar em branco.
    expect(w.text()).toContain('Dashboard')
  })
})
