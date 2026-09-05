import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import AdminDashboardView from '../AdminDashboardView.vue'
import dashboardService from '@/services/dashboard'

vi.mock('@/services/dashboard', () => ({
  default: { getAdminDashboard: vi.fn(), getAdminStats: vi.fn() },
}))
vi.mock('vue3-apexcharts', () => ({ default: { template: '<div class="apex-stub" />' } }))

const admin = () => ({
  stats: {
    total_organizations: 1, new_organizations_month: 0, churn_rate: 0,
    mrr: 499, gmv_this_month: 0, gmv_total: 0, total_vendors: 10,
    verified_vendors: 8, total_events: 5, active_events: 3,
    conversion_rate: 0, avg_response_time_hours: 0, active_users_30d: 2,
  },
  mrr_evolution: [{ month: '2026-09', label: 'set/26', value: 499 }],
  organizations_growth: [{ month: '2026-09', label: 'set/26', new_organizations: 1, churned: 0, net: 1 }],
  gmv_evolution: [{ month: '2026-09', label: 'set/26', value: 0 }],
  top_organizations: [{ id: 'o1', name: 'Empresa Demo', subscription_plan: 'professional', events_count: 5, users_count: 4, gmv: 0, city: null, state: null }],
  top_vendors: [{ id: 'v1', trade_name: 'Delícias Buffet', city: 'São Paulo', state: 'SP', revenue: 0, proposals_count: 0, approval_rate: 0, average_rating: 3.6, is_verified: true }],
  geographic_distribution: [{ state: 'SP', organizations: 1, vendors: 8 }],
  categories_demand: [{ id: 'c1', name: 'Buffet', icon: 'utensils', vendors_count: 2, quote_requests_count: 0 }],
  recent_activity: [{ type: 'new_vendor', message: 'Novo fornecedor: Delícias Buffet', created_at: '2026-09-05T00:00:00Z', entity_id: 'v1' }],
})

const montar = async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useAuthStore()
  store.user = {
    id: 'u1', name: 'Super Admin', email: 'admin@orchestra.local',
    organization_id: null, is_active: true, organization: null,
    roles: ['super-admin'], permissions: [],
  } as never
  store.token = 'tok'

  const w = mount(AdminDashboardView, {
    global: { plugins: [pinia], stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
  await flushPromises()
  return w
}

describe('AdminDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dashboardService.getAdminDashboard).mockResolvedValue(admin() as never)
  })

  it('carrega o dashboard da plataforma', async () => {
    await montar()

    expect(dashboardService.getAdminDashboard).toHaveBeenCalled()
  })

  it('exibe as métricas da plataforma', async () => {
    const w = await montar()

    expect(w.text()).toContain('MRR')
  })

  it('lista as organizações e fornecedores do topo', async () => {
    const w = await montar()

    expect(w.text()).toContain('Empresa Demo')
    expect(w.text()).toContain('Delícias Buffet')
  })

  it('mostra a distribuição geográfica', async () => {
    const w = await montar()

    expect(w.text()).toContain('SP')
  })

  it('mostra a atividade recente', async () => {
    const w = await montar()

    expect(w.text()).toContain('Novo fornecedor: Delícias Buffet')
  })

  it('não quebra quando a API falha', async () => {
    vi.mocked(dashboardService.getAdminDashboard).mockRejectedValueOnce(new Error('rede'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const w = await montar()

    expect(w.html()).toBeTruthy()
  })
})
