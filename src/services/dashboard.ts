import api from './api'

// Types for Admin Dashboard
export interface AdminStats {
  total_organizations: number
  new_organizations_month: number
  churn_rate: number
  mrr: number
  gmv_this_month: number
  gmv_total: number
  total_vendors: number
  verified_vendors: number
  total_events: number
  active_events: number
  conversion_rate: number
  avg_response_time_hours: number
  active_users_30d: number
}

export interface MrrEvolution {
  month: string
  label: string
  value: number
}

export interface OrganizationsGrowth {
  month: string
  label: string
  new_organizations: number
  churned: number
  net: number
}

export interface GmvEvolution {
  month: string
  label: string
  value: number
}

export interface TopOrganization {
  id: string
  name: string
  subscription_plan: string
  events_count: number
  users_count: number
  gmv: number
  city: string
  state: string
}

export interface TopVendorAdmin {
  id: string
  trade_name: string
  city: string
  state: string
  revenue: number
  proposals_count: number
  approval_rate: number
  average_rating: number
  is_verified: boolean
}

export interface GeographicData {
  state: string
  organizations: number
  vendors: number
}

export interface CategoryDemand {
  id: string
  name: string
  icon: string
  vendors_count: number
  quote_requests_count: number
}

export interface RecentActivity {
  type: string
  message: string
  created_at: string
  entity_id: string
}

export interface AdminDashboardData {
  stats: AdminStats
  mrr_evolution: MrrEvolution[]
  organizations_growth: OrganizationsGrowth[]
  gmv_evolution: GmvEvolution[]
  top_organizations: TopOrganization[]
  top_vendors: TopVendorAdmin[]
  geographic_distribution: GeographicData[]
  categories_demand: CategoryDemand[]
  recent_activity: RecentActivity[]
}

// Types for Client Dashboard
export interface BudgetEvent {
  id: string
  name: string
  estimated_budget: number
  spent: number
  remaining: number
  percentage: number
  /** Percentual sem limite: passa de 100 quando o orçamento estoura. */
  percentage_real: number
  /** Quanto passou do orçamento, em dinheiro. Zero quando não estourou. */
  over_amount: number
  status: 'ok' | 'warning' | 'over_budget'
}

export interface BudgetOverview {
  events: BudgetEvent[]
  totals: {
    total_budget: number
    total_spent: number
    savings: number
    percentage: number
    percentage_real: number
    over_amount: number
    over_budget_count: number
  }
}

export interface ProposalStatus {
  status: string
  label: string
  count: number
  total_value: number
}

export interface CategorySpending {
  id: string
  name: string
  icon: string
  color: string
  total: number
  count: number
  percentage: number
}

export interface SpendingByCategory {
  categories: CategorySpending[]
  total: number
}

export interface SpendingHistoryItem {
  month: string
  label: string
  spent: number
  planned: number
}

// API Functions
export const dashboardService = {
  // Client Dashboard
  async getDashboard() {
    const { data } = await api.get('/dashboard')
    return data.data
  },

  async getStats() {
    const { data } = await api.get('/dashboard/stats')
    return data.data
  },

  async getBudgetOverview(): Promise<BudgetOverview> {
    const { data } = await api.get('/dashboard/budget-overview')
    return data.data
  },

  async getProposalsByStatus(): Promise<ProposalStatus[]> {
    const { data } = await api.get('/dashboard/proposals-by-status')
    return data.data
  },

  async getSpendingByCategory(): Promise<SpendingByCategory> {
    const { data } = await api.get('/dashboard/spending-by-category')
    return data.data
  },

  async getSpendingHistory(months = 12): Promise<SpendingHistoryItem[]> {
    const { data } = await api.get(`/dashboard/spending-history?months=${months}`)
    return data.data
  },

  // Admin Dashboard
  async getAdminDashboard(): Promise<AdminDashboardData> {
    const { data } = await api.get('/admin/dashboard')
    return data.data
  },

  async getAdminStats(): Promise<AdminStats> {
    const { data } = await api.get('/admin/dashboard/stats')
    return data.data
  },

  async getTopOrganizations(limit = 10): Promise<TopOrganization[]> {
    const { data } = await api.get(`/admin/dashboard/organizations?limit=${limit}`)
    return data.data
  },

  async getTopVendors(limit = 10): Promise<TopVendorAdmin[]> {
    const { data } = await api.get(`/admin/dashboard/vendors?limit=${limit}`)
    return data.data
  },

  async getGeographicDistribution(): Promise<GeographicData[]> {
    const { data } = await api.get('/admin/dashboard/geographic')
    return data.data
  },

  async getCategoriesDemand(limit = 10): Promise<CategoryDemand[]> {
    const { data } = await api.get(`/admin/dashboard/categories?limit=${limit}`)
    return data.data
  },
}

export default dashboardService
