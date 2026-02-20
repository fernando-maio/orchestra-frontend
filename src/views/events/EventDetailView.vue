<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import eventsService from '@/services/events'
import type { Event } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// State
const event = ref<Event | null>(null)
const statistics = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const notFound = ref(false)
const actionLoading = ref(false)

// Computed
const eventId = computed(() => route.params.id as string)

const statusBadge = computed(() => {
  if (!event.value) return { class: '', label: '' }
  const badges: Record<string, { class: string; label: string }> = {
    draft: { class: 'bg-gray-100 text-gray-800', label: 'Rascunho' },
    active: { class: 'bg-green-100 text-green-800', label: 'Ativo' },
    completed: { class: 'bg-blue-100 text-blue-800', label: 'Concluido' },
    canceled: { class: 'bg-red-100 text-red-800', label: 'Cancelado' },
  }
  return badges[event.value.status] || { class: 'bg-gray-100 text-gray-800', label: event.value.status }
})

const fullAddress = computed(() => {
  if (!event.value) return ''
  const parts = [event.value.address, event.value.city, event.value.state]
  const address = parts.filter(Boolean).join(', ')
  if (event.value.zip_code) return `${address} - CEP: ${event.value.zip_code}`
  return address
})

const dateRange = computed(() => {
  if (!event.value) return ''
  const start = formatDate(event.value.start_date)
  if (event.value.end_date) {
    const end = formatDate(event.value.end_date)
    return `${start} - ${end}`
  }
  return start
})

const timeRange = computed(() => {
  if (!event.value) return ''
  const parts: string[] = []
  if (event.value.start_time) parts.push(event.value.start_time)
  if (event.value.end_time) parts.push(event.value.end_time)
  return parts.join(' - ')
})

const availableStatusTransitions = computed(() => {
  if (!event.value) return []
  const transitions: Record<string, { status: string; label: string; class: string }[]> = {
    draft: [
      { status: 'active', label: 'Ativar Evento', class: 'btn-success' },
    ],
    active: [
      { status: 'completed', label: 'Marcar como Concluido', class: 'btn-primary' },
      { status: 'canceled', label: 'Cancelar Evento', class: 'btn-danger' },
    ],
    canceled: [
      { status: 'draft', label: 'Voltar para Rascunho', class: 'btn-secondary' },
    ],
    completed: [],
  }
  return transitions[event.value.status] || []
})

const budgetProgress = computed(() => {
  if (!statistics.value) return 0
  const totalBudget = (statistics.value.total_budget as number) || (event.value?.estimated_budget || 0)
  const contracted = (statistics.value.contracted_value as number) || 0
  if (!totalBudget) return 0
  return Math.min(Math.round((contracted / totalBudget) * 100), 100)
})

// Methods
const loadEvent = async () => {
  loading.value = true
  notFound.value = false
  try {
    const [eventData, statsData] = await Promise.all([
      eventsService.get(eventId.value),
      eventsService.getStatistics(eventId.value).catch(() => null),
    ])
    event.value = eventData
    statistics.value = statsData
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: { message?: string } } }
    if (err.response?.status === 404) {
      notFound.value = true
    } else {
      toast.error(err.response?.data?.message || 'Erro ao carregar evento')
    }
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleStatusChange = async (status: string) => {
  if (!event.value) return
  actionLoading.value = true
  try {
    const updated = await eventsService.updateStatus(event.value.id, status)
    event.value = updated
    // Refresh statistics after status change
    statistics.value = await eventsService.getStatistics(event.value.id).catch(() => null)
    toast.success('Status atualizado com sucesso')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Erro ao atualizar status')
    console.error(error)
  } finally {
    actionLoading.value = false
  }
}

const handleDuplicate = async () => {
  if (!event.value) return
  actionLoading.value = true
  try {
    const newEvent = await eventsService.duplicate(event.value.id)
    toast.success('Evento duplicado com sucesso')
    router.push({ name: 'events-edit', params: { id: newEvent.id } })
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Erro ao duplicar evento')
    console.error(error)
  } finally {
    actionLoading.value = false
  }
}

const handleDelete = async () => {
  if (!event.value) return
  if (!globalThis.confirm(`Deseja realmente excluir "${event.value.name}"? Esta acao nao pode ser desfeita.`)) return

  actionLoading.value = true
  try {
    await eventsService.delete(event.value.id)
    toast.success('Evento excluido com sucesso')
    router.push({ name: 'events' })
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Erro ao excluir evento')
    console.error(error)
  } finally {
    actionLoading.value = false
  }
}

// Helpers
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const formatNumber = (value?: unknown) => {
  if (value === undefined || value === null) return '0'
  return Number(value).toLocaleString('pt-BR')
}

// Lifecycle
onMounted(() => {
  loadEvent()
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Not Found -->
    <div v-else-if="notFound" class="text-center py-12">
      <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="mt-4 text-xl font-semibold text-gray-900">Evento nao encontrado</h2>
      <p class="mt-2 text-gray-500">O evento que voce esta procurando nao existe ou foi removido.</p>
      <div class="mt-6">
        <router-link :to="{ name: 'events' }" class="btn btn-primary">
          Voltar para Eventos
        </router-link>
      </div>
    </div>

    <!-- Event Detail -->
    <template v-else-if="event">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-4">
          <router-link :to="{ name: 'events' }" class="text-gray-500 hover:text-gray-700 transition-colors">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </router-link>
          <span class="text-gray-400">/</span>
          <router-link :to="{ name: 'events' }" class="text-sm text-gray-500 hover:text-gray-700">Eventos</router-link>
          <span class="text-gray-400">/</span>
          <span class="text-sm text-gray-700">{{ event.name }}</span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900">{{ event.name }}</h1>
            <span
              :class="statusBadge.class"
              class="px-3 py-1 text-xs font-semibold rounded-full"
            >
              {{ statusBadge.label }}
            </span>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <router-link
              :to="{ name: 'events-edit', params: { id: event.id } }"
              class="btn btn-secondary gap-2"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </router-link>
            <button
              @click="handleDuplicate"
              :disabled="actionLoading"
              class="btn btn-secondary gap-2"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicar
            </button>
            <button
              @click="handleDelete"
              :disabled="actionLoading"
              class="btn btn-danger gap-2"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Excluir
            </button>
          </div>
        </div>
      </div>

      <!-- Info Cards Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Date Range -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-indigo-100 rounded-lg">
              <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500">Data</p>
              <p class="text-sm font-semibold text-gray-900 mt-0.5">{{ dateRange }}</p>
              <p v-if="timeRange" class="text-xs text-gray-500 mt-0.5">{{ timeRange }}</p>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-green-100 rounded-lg">
              <svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500">Local</p>
              <p class="text-sm font-semibold text-gray-900 mt-0.5 truncate">{{ event.city }}, {{ event.state }}</p>
              <p v-if="event.venue_name" class="text-xs text-gray-500 mt-0.5 truncate">{{ event.venue_name }}</p>
            </div>
          </div>
        </div>

        <!-- Budget -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-yellow-100 rounded-lg">
              <svg class="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500">Orcamento</p>
              <p class="text-sm font-semibold text-gray-900 mt-0.5">{{ formatCurrency(event.estimated_budget) }}</p>
              <p v-if="event.actual_budget" class="text-xs text-gray-500 mt-0.5">Real: {{ formatCurrency(event.actual_budget) }}</p>
            </div>
          </div>
        </div>

        <!-- Attendees -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-start gap-3">
            <div class="p-2 bg-purple-100 rounded-lg">
              <svg class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500">Participantes</p>
              <p class="text-sm font-semibold text-gray-900 mt-0.5">
                {{ event.expected_attendees ? formatNumber(event.expected_attendees) : '-' }}
              </p>
              <p class="text-xs text-gray-500 mt-0.5">esperados</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics Section -->
      <div v-if="statistics" class="mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Estatisticas</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Total Quote Requests -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p class="text-sm font-medium text-gray-500">Cotacoes</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatNumber(statistics.total_quote_requests) }}</p>
            <p class="text-xs text-gray-500 mt-1">solicitacoes enviadas</p>
          </div>

          <!-- Total Proposals -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p class="text-sm font-medium text-gray-500">Propostas</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatNumber(statistics.total_proposals) }}</p>
            <p class="text-xs text-gray-500 mt-1">recebidas</p>
          </div>

          <!-- Accepted Proposals -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p class="text-sm font-medium text-gray-500">Aprovadas</p>
            <p class="text-2xl font-bold text-green-600 mt-1">{{ formatNumber(statistics.accepted_proposals) }}</p>
            <p class="text-xs text-gray-500 mt-1">propostas aceitas</p>
          </div>

          <!-- Contracted Proposals -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p class="text-sm font-medium text-gray-500">Contratadas</p>
            <p class="text-2xl font-bold text-indigo-600 mt-1">{{ formatNumber(statistics.contracted_proposals) }}</p>
            <p class="text-xs text-gray-500 mt-1">fornecedores contratados</p>
          </div>

          <!-- Budget Progress -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p class="text-sm font-medium text-gray-500">Orcamento</p>
            <p class="text-2xl font-bold mt-1" :class="budgetProgress > 90 ? 'text-red-600' : budgetProgress > 70 ? 'text-yellow-600' : 'text-green-600'">
              {{ budgetProgress }}%
            </p>
            <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="budgetProgress > 90 ? 'bg-red-500' : budgetProgress > 70 ? 'bg-yellow-500' : 'bg-green-500'"
                :style="{ width: `${budgetProgress}%` }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 mt-1">utilizado</p>
          </div>
        </div>
      </div>

      <!-- Event Details and Status Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Event Details Card -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-100">
            <h2 class="text-lg font-semibold text-gray-900">Detalhes do Evento</h2>
          </div>
          <div class="p-6 space-y-6">
            <!-- Description -->
            <div v-if="event.description">
              <h3 class="text-sm font-medium text-gray-500 mb-1">Descricao</h3>
              <p class="text-gray-900 whitespace-pre-line">{{ event.description }}</p>
            </div>

            <!-- Briefing -->
            <div v-if="event.briefing">
              <h3 class="text-sm font-medium text-gray-500 mb-1">Briefing</h3>
              <p class="text-gray-900 whitespace-pre-line">{{ event.briefing }}</p>
            </div>

            <!-- Venue -->
            <div v-if="event.venue_name">
              <h3 class="text-sm font-medium text-gray-500 mb-1">Local / Venue</h3>
              <p class="text-gray-900">{{ event.venue_name }}</p>
            </div>

            <!-- Full Address -->
            <div>
              <h3 class="text-sm font-medium text-gray-500 mb-1">Endereco Completo</h3>
              <p class="text-gray-900">{{ fullAddress }}</p>
            </div>

            <!-- Required Categories -->
            <div v-if="event.required_categories && event.required_categories.length > 0">
              <h3 class="text-sm font-medium text-gray-500 mb-2">Categorias Necessarias</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="category in event.required_categories"
                  :key="category"
                  class="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full"
                >
                  {{ category }}
                </span>
              </div>
            </div>

            <!-- Creator Info -->
            <div v-if="event.creator">
              <h3 class="text-sm font-medium text-gray-500 mb-1">Criado por</h3>
              <p class="text-gray-900">{{ event.creator.name }} ({{ event.creator.email }})</p>
            </div>

            <!-- Quote Requests -->
            <div v-if="event.quote_requests && event.quote_requests.length > 0">
              <h3 class="text-sm font-medium text-gray-500 mb-2">Solicitacoes de Cotacao</h3>
              <div class="space-y-2">
                <router-link
                  v-for="quote in event.quote_requests"
                  :key="quote.id"
                  :to="{ name: 'quotes-detail', params: { id: quote.id } }"
                  class="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-gray-900">{{ quote.title }}</p>
                      <p class="text-sm text-gray-500">{{ quote.category?.name || 'Sem categoria' }}</p>
                    </div>
                    <span
                      :class="{
                        'bg-gray-100 text-gray-800': quote.status === 'draft',
                        'bg-green-100 text-green-800': quote.status === 'open',
                        'bg-blue-100 text-blue-800': quote.status === 'in_review',
                        'bg-indigo-100 text-indigo-800': quote.status === 'closed',
                        'bg-red-100 text-red-800': quote.status === 'canceled',
                      }"
                      class="px-2 py-1 text-xs font-semibold rounded-full"
                    >
                      {{ quote.status }}
                    </span>
                  </div>
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Actions Card -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="px-6 py-4 border-b border-gray-100">
              <h2 class="text-lg font-semibold text-gray-900">Acoes</h2>
            </div>
            <div class="p-6 space-y-4">
              <!-- Current Status -->
              <div>
                <p class="text-sm font-medium text-gray-500 mb-2">Status Atual</p>
                <span
                  :class="statusBadge.class"
                  class="px-3 py-1.5 text-sm font-semibold rounded-full"
                >
                  {{ statusBadge.label }}
                </span>
              </div>

              <!-- Status Transitions -->
              <div v-if="availableStatusTransitions.length > 0">
                <p class="text-sm font-medium text-gray-500 mb-3">Alterar Status</p>
                <div class="space-y-2">
                  <button
                    v-for="transition in availableStatusTransitions"
                    :key="transition.status"
                    @click="handleStatusChange(transition.status)"
                    :disabled="actionLoading"
                    :class="transition.class"
                    class="w-full"
                  >
                    {{ transition.label }}
                  </button>
                </div>
              </div>

              <div v-else class="text-sm text-gray-500">
                <p>Nenhuma transicao de status disponivel para o estado atual.</p>
              </div>

              <!-- Divider -->
              <hr class="border-gray-200" />

              <!-- Quick Actions -->
              <div class="space-y-2">
                <router-link
                  :to="{ name: 'events-edit', params: { id: event.id } }"
                  class="btn btn-secondary w-full gap-2"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Evento
                </router-link>
                <button
                  @click="handleDuplicate"
                  :disabled="actionLoading"
                  class="btn btn-secondary w-full gap-2"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Duplicar Evento
                </button>
                <button
                  @click="handleDelete"
                  :disabled="actionLoading"
                  class="btn btn-danger w-full gap-2"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Excluir Evento
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
