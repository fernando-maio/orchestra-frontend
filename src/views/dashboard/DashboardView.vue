<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { StatsCard, DonutChart, AreaChart, ProgressBar } from '@/components/charts'
import dashboardService, {
  type BudgetOverview,
  type ProposalStatus,
  type SpendingByCategory,
  type SpendingHistoryItem,
} from '@/services/dashboard'
import type { DashboardStats, UpcomingEvent, TopVendor } from '@/types'

const authStore = useAuthStore()
const loading = ref(true)
const stats = ref<DashboardStats | null>(null)
const upcomingEvents = ref<UpcomingEvent[]>([])
const topVendors = ref<TopVendor[]>([])

// Chart data
const budgetOverview = ref<BudgetOverview | null>(null)
const proposalsByStatus = ref<ProposalStatus[]>([])
const spendingByCategory = ref<SpendingByCategory | null>(null)
const spendingHistory = ref<SpendingHistoryItem[]>([])

onMounted(async () => {
  try {
    // Fetch all data in parallel
    const [dashboardData, budget, proposals, spending, history] = await Promise.all([
      dashboardService.getDashboard(),
      dashboardService.getBudgetOverview(),
      dashboardService.getProposalsByStatus(),
      dashboardService.getSpendingByCategory(),
      dashboardService.getSpendingHistory(12),
    ])

    stats.value = dashboardData.stats
    upcomingEvents.value = dashboardData.upcoming_events
    topVendors.value = dashboardData.top_vendors
    budgetOverview.value = budget
    proposalsByStatus.value = proposals
    spendingByCategory.value = spending
    spendingHistory.value = history
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

// Chart computed data
const spendingDonutData = computed(() => {
  if (!spendingByCategory.value?.categories?.length) {
    return { series: [] as number[], labels: [] as string[], colors: [] as string[] }
  }
  const cats = spendingByCategory.value.categories.slice(0, 6)
  const defaultColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']
  return {
    series: cats.map(c => c.total),
    labels: cats.map(c => c.name),
    colors: cats.map((c, i) => c.color ?? defaultColors[i % defaultColors.length]),
  }
})

const spendingHistoryData = computed(() => {
  if (!spendingHistory.value?.length) {
    return { series: [], categories: [] }
  }
  return {
    series: [
      { name: 'Gasto', data: spendingHistory.value.map(h => h.spent) },
      { name: 'Planejado', data: spendingHistory.value.map(h => h.planned) },
    ],
    categories: spendingHistory.value.map(h => h.label),
  }
})

const proposalsDonutData = computed(() => {
  if (!proposalsByStatus.value?.length) {
    return { series: [], labels: [] }
  }
  const filtered = proposalsByStatus.value.filter(p => p.count > 0)
  const colors: Record<string, string> = {
    draft: '#9ca3af',
    pending: '#f59e0b',
    under_review: '#3b82f6',
    approved: '#10b981',
    rejected: '#ef4444',
    contracted: '#8b5cf6',
  }
  return {
    series: filtered.map(p => p.count),
    labels: filtered.map(p => p.label),
    colors: filtered.map(p => colors[p.status] || '#6b7280'),
  }
})

// Calculated insights
const budgetInsight = computed(() => {
  if (!budgetOverview.value) return null
  const overBudget = budgetOverview.value.events.filter(e => e.status === 'over_budget')
  const warning = budgetOverview.value.events.filter(e => e.status === 'warning')
  if (overBudget.length > 0) {
    return {
      type: 'danger',
      message: `${overBudget.length} evento(s) acima do orçamento`,
      icon: '⚠️',
    }
  }
  if (warning.length > 0) {
    return {
      type: 'warning',
      message: `${warning.length} evento(s) próximo(s) do limite`,
      icon: '⚡',
    }
  }
  if (budgetOverview.value.totals.savings > 0) {
    return {
      type: 'success',
      message: `Economia potencial de ${formatCurrency(budgetOverview.value.totals.savings)}`,
      icon: '💰',
    }
  }
  return null
})

const pendingProposalsCount = computed(() => {
  const pending = proposalsByStatus.value.find(p => p.status === 'pending')
  return pending?.count || 0
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">
        Bem-vindo de volta, {{ authStore.user?.name }}!
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <template v-else>
      <!-- Insights Alert -->
      <div
        v-if="budgetInsight"
        :class="[
          'mb-6 p-4 rounded-lg flex items-center gap-3',
          budgetInsight.type === 'danger' ? 'bg-red-50 text-red-800 border border-red-200' :
          budgetInsight.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
          'bg-green-50 text-green-800 border border-green-200'
        ]"
      >
        <span class="text-2xl">{{ budgetInsight.icon }}</span>
        <span class="font-medium">{{ budgetInsight.message }}</span>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Eventos Ativos"
          :value="stats?.active_events ?? 0"
          icon="📅"
          variant="primary"
          :subtitle="`${stats?.events_this_month ?? 0} este mês`"
        />
        <StatsCard
          title="Orçamento Total"
          :value="formatCurrency(stats?.active_budget ?? 0)"
          icon="💰"
          variant="success"
          subtitle="Eventos ativos"
        />
        <StatsCard
          title="Propostas Pendentes"
          :value="pendingProposalsCount"
          icon="📋"
          :variant="pendingProposalsCount > 5 ? 'warning' : 'default'"
          subtitle="Aguardando análise"
        />
        <StatsCard
          title="Taxa de Resposta"
          :value="`${stats?.response_rate ?? 0}%`"
          icon="⚡"
          :variant="(stats?.response_rate ?? 0) > 70 ? 'success' : 'warning'"
          subtitle="Últimos 30 dias"
        />
      </div>

      <!-- Charts Row 1: Budget Overview -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <!-- Budget Progress per Event -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Orçamento por Evento</h3>
          <div v-if="budgetOverview?.events?.length" class="space-y-4">
            <div v-for="event in budgetOverview.events.slice(0, 5)" :key="event.id">
              <ProgressBar
                :value="event.spent"
                :max="event.estimated_budget"
                :label="event.name"
                :variant="event.status === 'over_budget' ? 'danger' : event.status === 'warning' ? 'warning' : 'default'"
              />
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            <p>Nenhum evento ativo com orçamento definido</p>
          </div>
          <!-- Totals Summary -->
          <div v-if="budgetOverview?.totals" class="mt-6 pt-4 border-t border-gray-100">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-sm text-gray-500">Orçamento Total</p>
                <p class="text-lg font-semibold text-gray-900">{{ formatCurrency(budgetOverview.totals.total_budget) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Gasto Atual</p>
                <p class="text-lg font-semibold text-indigo-600">{{ formatCurrency(budgetOverview.totals.total_spent) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Disponível</p>
                <p class="text-lg font-semibold text-green-600">{{ formatCurrency(budgetOverview.totals.savings) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Spending by Category Donut -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <DonutChart
            v-if="spendingDonutData.series.length"
            title="Gastos por Categoria"
            :series="spendingDonutData.series"
            :labels="spendingDonutData.labels"
            :colors="spendingDonutData.colors"
            :height="280"
            :center-label="'Total'"
            :center-value="formatCurrency(spendingByCategory?.total ?? 0)"
          />
          <div v-else class="h-[280px] flex items-center justify-center text-gray-500">
            <p>Nenhum gasto registrado</p>
          </div>
        </div>
      </div>

      <!-- Charts Row 2: History and Proposals -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <!-- Spending History -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <AreaChart
            v-if="spendingHistoryData.series.length"
            title="Histórico de Gastos"
            :series="spendingHistoryData.series"
            :categories="spendingHistoryData.categories"
            :height="300"
            :colors="['#6366f1', '#e2e8f0']"
            :formatter="formatCurrency"
          />
          <div v-else class="h-[300px] flex items-center justify-center text-gray-500">
            <p>Dados insuficientes para exibir histórico</p>
          </div>
        </div>

        <!-- Proposals by Status -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <DonutChart
            v-if="proposalsDonutData.series.length"
            title="Propostas por Status"
            :series="proposalsDonutData.series"
            :labels="proposalsDonutData.labels"
            :colors="proposalsDonutData.colors"
            :height="300"
          />
          <div v-else class="h-[300px] flex items-center justify-center text-gray-500">
            <p>Nenhuma proposta registrada</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions and Lists -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <!-- Quick Actions -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div class="space-y-3">
            <router-link
              to="/events/create"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div class="p-2 bg-indigo-100 rounded-lg">
                <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">Criar Novo Evento</p>
                <p class="text-sm text-gray-500">Comece a planejar seu próximo evento</p>
              </div>
            </router-link>
            <router-link
              to="/vendors"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div class="p-2 bg-green-100 rounded-lg">
                <svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">Buscar Fornecedores</p>
                <p class="text-sm text-gray-500">Encontre fornecedores próximos</p>
              </div>
            </router-link>
            <router-link
              to="/proposals"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div class="p-2 bg-yellow-100 rounded-lg">
                <svg class="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">Avaliar Propostas</p>
                <p class="text-sm text-gray-500">{{ pendingProposalsCount }} aguardando análise</p>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Welcome Card -->
        <div class="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-sm p-6 text-white">
          <h3 class="text-lg font-semibold mb-2">Bem-vindo ao Orchestra!</h3>
          <p class="text-indigo-100 mb-4">
            Sua plataforma completa para gestão de fornecedores de eventos corporativos.
            Centralize orçamentos, compare propostas e gerencie compliance.
          </p>
          <div class="flex gap-3">
            <router-link
              to="/events/create"
              class="inline-flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors"
            >
              Criar Evento
            </router-link>
            <a
              href="#"
              class="inline-flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium text-sm hover:bg-indigo-400 transition-colors"
            >
              Ver Tutorial
            </a>
          </div>
        </div>
      </div>

      <!-- Upcoming Events and Top Vendors -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Upcoming Events -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Próximos Eventos</h3>
            <router-link to="/events" class="text-sm text-indigo-600 hover:text-indigo-700">
              Ver todos
            </router-link>
          </div>
          <div class="p-4">
            <div v-if="upcomingEvents.length > 0" class="space-y-3">
              <router-link
                v-for="event in upcomingEvents"
                :key="event.id"
                :to="`/events/${event.id}`"
                class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center gap-4">
                  <div class="flex flex-col items-center justify-center p-2 bg-indigo-50 rounded-lg min-w-[60px]">
                    <span class="text-xs text-indigo-600 font-medium">{{ formatDate(event.start_date) }}</span>
                    <span class="text-lg font-bold text-indigo-700">{{ Math.ceil(event.days_until) }}</span>
                    <span class="text-xs text-indigo-500">dias</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ event.name }}</p>
                    <p class="text-sm text-gray-500">{{ event.city }}, {{ event.state }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-900">{{ formatCurrency(event.estimated_budget) }}</p>
                  <p class="text-xs text-gray-500">{{ event.expected_attendees }} pessoas</p>
                </div>
              </router-link>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="mt-2">Nenhum evento próximo</p>
              <router-link to="/events/create" class="text-sm text-indigo-600 hover:text-indigo-700">
                Criar primeiro evento
              </router-link>
            </div>
          </div>
        </div>

        <!-- Top Vendors -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Fornecedores Destaque</h3>
            <router-link to="/vendors" class="text-sm text-indigo-600 hover:text-indigo-700">
              Ver todos
            </router-link>
          </div>
          <div class="p-4">
            <div v-if="topVendors.length > 0" class="space-y-3">
              <router-link
                v-for="vendor in topVendors"
                :key="vendor.id"
                :to="`/vendors/${vendor.id}`"
                class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-gray-600">{{ vendor.trade_name.charAt(0) }}</span>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-gray-900">{{ vendor.trade_name }}</p>
                      <svg v-if="vendor.is_verified" class="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <p class="text-sm text-gray-500">{{ vendor.city }}, {{ vendor.state }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <svg class="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span class="font-medium text-gray-900">{{ vendor.average_rating.toFixed(1) }}</span>
                  <span class="text-sm text-gray-500">({{ vendor.total_ratings }})</span>
                </div>
              </router-link>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p class="mt-2">Nenhum fornecedor cadastrado</p>
              <router-link to="/vendors/create" class="text-sm text-indigo-600 hover:text-indigo-700">
                Cadastrar fornecedor
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
