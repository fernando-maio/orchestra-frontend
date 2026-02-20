import { describe, it, expect, vi, beforeEach } from 'vitest'
import dashboardService from '@/services/dashboard'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

import api from '@/services/api'

describe('Dashboard Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Client Dashboard', () => {
    it('getDashboard should fetch full dashboard', async () => {
      const mockData = { stats: {}, upcoming_events: [] }
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockData } })

      const result = await dashboardService.getDashboard()
      expect(api.get).toHaveBeenCalledWith('/dashboard')
      expect(result).toEqual(mockData)
    })

    it('getStats should fetch stats only', async () => {
      const mockStats = { active_events: 5, total_vendors: 20 }
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockStats } })

      const result = await dashboardService.getStats()
      expect(api.get).toHaveBeenCalledWith('/dashboard/stats')
      expect(result).toEqual(mockStats)
    })

    it('getBudgetOverview should fetch budget data', async () => {
      const mockBudget = {
        events: [{ id: '1', name: 'Event', estimated_budget: 50000, spent: 30000, remaining: 20000, percentage: 60, status: 'ok' }],
        totals: { total_budget: 50000, total_spent: 30000, savings: 20000, percentage: 60 },
      }
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockBudget } })

      const result = await dashboardService.getBudgetOverview()
      expect(api.get).toHaveBeenCalledWith('/dashboard/budget-overview')
      expect(result.events).toHaveLength(1)
      expect(result.totals.total_budget).toBe(50000)
    })

    it('getProposalsByStatus should fetch proposals grouped by status', async () => {
      const mockProposals = [
        { status: 'pending', label: 'Pendente', count: 5, total_value: 25000 },
        { status: 'approved', label: 'Aprovada', count: 3, total_value: 15000 },
      ]
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockProposals } })

      const result = await dashboardService.getProposalsByStatus()
      expect(result).toHaveLength(2)
    })

    it('getSpendingHistory should pass months parameter', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } })

      await dashboardService.getSpendingHistory(6)
      expect(api.get).toHaveBeenCalledWith('/dashboard/spending-history?months=6')
    })
  })

  describe('Admin Dashboard', () => {
    it('getAdminDashboard should fetch full admin dashboard', async () => {
      const mockData = {
        stats: { total_organizations: 10 },
        mrr_evolution: [],
        top_organizations: [],
      }
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockData } })

      const result = await dashboardService.getAdminDashboard()
      expect(api.get).toHaveBeenCalledWith('/admin/dashboard')
      expect(result.stats.total_organizations).toBe(10)
    })

    it('getAdminStats should fetch admin stats only', async () => {
      const mockStats = { mrr: 5000, total_organizations: 10, churn_rate: 2.5 }
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockStats } })

      const result = await dashboardService.getAdminStats()
      expect(api.get).toHaveBeenCalledWith('/admin/dashboard/stats')
      expect(result.mrr).toBe(5000)
    })

    it('getTopOrganizations should pass limit', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } })

      await dashboardService.getTopOrganizations(5)
      expect(api.get).toHaveBeenCalledWith('/admin/dashboard/organizations?limit=5')
    })

    it('getTopVendors should pass limit', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } })

      await dashboardService.getTopVendors(20)
      expect(api.get).toHaveBeenCalledWith('/admin/dashboard/vendors?limit=20')
    })

    it('getGeographicDistribution should fetch geographic data', async () => {
      const mockGeo = [{ state: 'SP', organizations: 5, vendors: 20 }]
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockGeo } })

      const result = await dashboardService.getGeographicDistribution()
      expect(result[0]!.state).toBe('SP')
    })

    it('getCategoriesDemand should fetch categories with demand', async () => {
      const mockCats = [{ id: '1', name: 'Buffet', vendors_count: 10, quote_requests_count: 25 }]
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockCats } })

      const result = await dashboardService.getCategoriesDemand()
      expect(result[0]!.name).toBe('Buffet')
    })
  })
})
