<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { StatsCard, AreaChart, BarChart, ComboChart, RadialChart } from '@/components/charts'
import dashboardService, {
  type AdminDashboardData,
  type AdminStats,
} from '@/services/dashboard'

const loading = ref(true)
const dashboardData = ref<AdminDashboardData | null>(null)
const stats = ref<AdminStats | null>(null)

onMounted(async () => {
  try {
    dashboardData.value = await dashboardService.getAdminDashboard()
    stats.value = dashboardData.value.stats
  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
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

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value)
}

// Chart data computed
const mrrChartData = computed(() => {
  if (!dashboardData.value?.mrr_evolution) return { series: [], categories: [] }
  return {
    series: [{
      name: 'MRR',
      data: dashboardData.value.mrr_evolution.map(item => item.value),
    }],
    categories: dashboardData.value.mrr_evolution.map(item => item.label),
  }
})

const gmvChartData = computed(() => {
  if (!dashboardData.value?.gmv_evolution) return { series: [], categories: [] }
  return {
    series: [{
      name: 'GMV',
      data: dashboardData.value.gmv_evolution.map(item => item.value),
    }],
    categories: dashboardData.value.gmv_evolution.map(item => item.label),
  }
})

const growthChartData = computed(() => {
  if (!dashboardData.value?.organizations_growth) return { series: [], categories: [] }
  const growth = dashboardData.value.organizations_growth
  return {
    series: [
      { name: 'Novas', type: 'column' as const, data: growth.map(item => item.new_organizations) },
      { name: 'Churn', type: 'column' as const, data: growth.map(item => item.churned) },
      { name: 'Net', type: 'line' as const, data: growth.map(item => item.net) },
    ],
    categories: growth.map(item => item.label),
  }
})

const categoriesChartData = computed(() => {
  if (!dashboardData.value?.categories_demand) return { series: [], categories: [] }
  const cats = dashboardData.value.categories_demand.slice(0, 8)
  return {
    series: [{ name: 'Cotações', data: cats.map(c => c.quote_requests_count) }],
    categories: cats.map(c => c.name),
  }
})

const geographicChartData = computed(() => {
  if (!dashboardData.value?.geographic_distribution) return { series: [], categories: [] as string[] }
  const geo = dashboardData.value.geographic_distribution
    .filter(g => g.organizations > 0 || g.vendors > 0)
    .sort((a, b) => (b.organizations + b.vendors) - (a.organizations + a.vendors))
    .slice(0, 10)
  return {
    series: [
      { name: 'Organizações', data: geo.map(g => g.organizations) },
      { name: 'Fornecedores', data: geo.map(g => g.vendors) },
    ],
    categories: geo.map(g => g.state),
  }
})

const activityTypeIcons: Record<string, { icon: string; color: string }> = {
  new_organization: { icon: '🏢', color: 'bg-blue-100 text-blue-600' },
  new_vendor: { icon: '🏪', color: 'bg-green-100 text-green-600' },
  proposal_approved: { icon: '✅', color: 'bg-emerald-100 text-emerald-600' },
}

const getActivityStyle = (type: string) => activityTypeIcons[type] || { icon: '📋', color: 'bg-gray-100 text-gray-600' }

const timeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays}d atrás`
  if (diffHours > 0) return `${diffHours}h atrás`
  if (diffMins > 0) return `${diffMins}min atrás`
  return 'agora'
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
      <p class="mt-1 text-sm text-gray-500">
        Visão geral da plataforma Orchestra
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <template v-else-if="stats">
      <!-- Stats Cards Row 1 -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="MRR"
          :value="formatCurrency(stats.mrr)"
          icon="💰"
          variant="primary"
          subtitle="Receita Recorrente Mensal"
        />
        <StatsCard
          title="Organizações"
          :value="formatNumber(stats.total_organizations)"
          icon="🏢"
          variant="success"
          :trend="stats.new_organizations_month > 0 ? stats.new_organizations_month : undefined"
          :trend-label="`+${stats.new_organizations_month} este mês`"
        />
        <StatsCard
          title="GMV Mensal"
          :value="formatCurrency(stats.gmv_this_month)"
          icon="📊"
          variant="primary"
          subtitle="Volume de Transações"
        />
        <StatsCard
          title="Churn Rate"
          :value="`${stats.churn_rate}%`"
          icon="📉"
          :variant="stats.churn_rate > 5 ? 'danger' : stats.churn_rate > 3 ? 'warning' : 'success'"
          subtitle="Taxa de Cancelamento"
        />
      </div>

      <!-- Stats Cards Row 2 -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Fornecedores"
          :value="formatNumber(stats.total_vendors)"
          icon="🏪"
          variant="default"
          :subtitle="`${stats.verified_vendors} verificados`"
        />
        <StatsCard
          title="Eventos Ativos"
          :value="formatNumber(stats.active_events)"
          icon="📅"
          variant="default"
          :subtitle="`${stats.total_events} total`"
        />
        <StatsCard
          title="Taxa de Conversão"
          :value="`${stats.conversion_rate}%`"
          icon="🎯"
          :variant="stats.conversion_rate > 30 ? 'success' : 'warning'"
          subtitle="Cotações → Contratos"
        />
        <StatsCard
          title="Tempo de Resposta"
          :value="`${stats.avg_response_time_hours}h`"
          icon="⏱️"
          :variant="stats.avg_response_time_hours < 24 ? 'success' : 'warning'"
          subtitle="Média dos Fornecedores"
        />
      </div>

      <!-- Charts Row 1 -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <!-- MRR Evolution -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <AreaChart
            title="Evolução do MRR"
            :series="mrrChartData.series"
            :categories="mrrChartData.categories"
            :height="300"
            :colors="['#6366f1']"
            :formatter="formatCurrency"
          />
        </div>

        <!-- GMV Evolution -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <AreaChart
            title="GMV Mensal"
            :series="gmvChartData.series"
            :categories="gmvChartData.categories"
            :height="300"
            :colors="['#10b981']"
            :formatter="formatCurrency"
          />
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <!-- Organizations Growth -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <ComboChart
            title="Crescimento de Organizações"
            :series="growthChartData.series"
            :categories="growthChartData.categories"
            :height="300"
            :colors="['#10b981', '#ef4444', '#6366f1']"
          />
        </div>

        <!-- Categories Demand -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <BarChart
            title="Categorias Mais Demandadas"
            :series="categoriesChartData.series"
            :categories="categoriesChartData.categories"
            :height="300"
            :horizontal="true"
            :colors="['#8b5cf6']"
          />
        </div>
      </div>

      <!-- Charts Row 3 -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <!-- Geographic Distribution -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <BarChart
            title="Distribuição Geográfica"
            :series="geographicChartData.series"
            :categories="geographicChartData.categories"
            :height="300"
            :colors="['#6366f1', '#10b981']"
          />
        </div>

        <!-- Conversion Rate Gauge -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <RadialChart
            title="Taxa de Conversão"
            :value="stats.conversion_rate"
            label="Cotações → Contratos"
            :height="280"
            :color="stats.conversion_rate > 30 ? '#10b981' : '#f59e0b'"
          />
        </div>
      </div>

      <!-- Bottom Row: Top Organizations and Activity -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Top Organizations -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="p-6 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">Top Organizações</h3>
            <p class="text-sm text-gray-500">Por volume de transações (GMV)</p>
          </div>
          <div class="divide-y divide-gray-100">
            <div
              v-for="(org, index) in dashboardData?.top_organizations?.slice(0, 5)"
              :key="org.id"
              class="p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div class="flex items-center gap-4">
                <span class="text-lg font-bold text-gray-400 w-6">{{ index + 1 }}</span>
                <div>
                  <p class="font-medium text-gray-900">{{ org.name }}</p>
                  <p class="text-sm text-gray-500">
                    {{ org.events_count }} eventos · {{ org.users_count }} usuários
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-900">{{ formatCurrency(org.gmv) }}</p>
                <span
                  :class="[
                    'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
                    org.subscription_plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                    org.subscription_plan === 'professional' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  ]"
                >
                  {{ org.subscription_plan }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="p-6 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">Atividade Recente</h3>
            <p class="text-sm text-gray-500">Últimos 7 dias</p>
          </div>
          <div class="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            <div
              v-for="activity in dashboardData?.recent_activity"
              :key="activity.entity_id + activity.created_at"
              class="p-4 flex items-start gap-4 hover:bg-gray-50"
            >
              <div :class="['p-2 rounded-lg', getActivityStyle(activity.type).color]">
                <span class="text-lg">{{ getActivityStyle(activity.type).icon }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900">{{ activity.message }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ timeAgo(activity.created_at) }}</p>
              </div>
            </div>
            <div v-if="!dashboardData?.recent_activity?.length" class="p-8 text-center text-gray-500">
              Nenhuma atividade recente
            </div>
          </div>
        </div>
      </div>

      <!-- Top Vendors -->
      <div class="mt-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">Top Fornecedores</h3>
          <p class="text-sm text-gray-500">Por faturamento na plataforma</p>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Faturamento</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Propostas</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aprovação</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="(vendor, index) in dashboardData?.top_vendors?.slice(0, 10)"
                :key="vendor.id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400">{{ index + 1 }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">{{ vendor.trade_name }}</span>
                    <svg v-if="vendor.is_verified" class="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ vendor.city }}, {{ vendor.state }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{{ formatCurrency(vendor.revenue) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{{ vendor.proposals_count }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span :class="vendor.approval_rate > 50 ? 'text-green-600' : 'text-yellow-600'">
                    {{ vendor.approval_rate }}%
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <div class="flex items-center justify-end gap-1">
                    <svg class="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="font-medium">{{ vendor.average_rating.toFixed(1) }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
