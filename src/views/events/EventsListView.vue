<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import dashboardService, { type TopOrganization } from '@/services/dashboard'
import { useToast } from 'vue-toastification'
import eventsService, { type EventFilters, type PaginatedEvents } from '@/services/events'
import type { Event } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

// State
const events = ref<Event[]>([])
const loading = ref(true)
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = ref(15)

// Filters
const filters = ref<EventFilters>({
  search: '',
  status: '',
  organization_id: '',
})

// Só o super-admin enxerga eventos de várias organizações (o global scope
// BelongsToOrganization prende os demais à própria). Para todo mundo o filtro
// seria uma caixa com uma opção só.
const organizations = ref<TopOrganization[]>([])

const loadOrganizations = async () => {
  if (!auth.isSuperAdmin) return
  try {
    organizations.value = await dashboardService.getTopOrganizations(100)
  } catch (error) {
    console.error(error)
  }
}

const searchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Computed
const hasFilters = computed(() => {
  return filters.value.search || filters.value.status
})

// Methods
const loadEvents = async () => {
  loading.value = true
  try {
    const result: PaginatedEvents = await eventsService.list({
      ...filters.value,
      page: currentPage.value,
      per_page: perPage.value,
    })
    events.value = result.data
    lastPage.value = result.meta.last_page
    total.value = result.meta.total
  } catch (error) {
    toast.error('Erro ao carregar eventos')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.search = searchQuery.value
    currentPage.value = 1
    loadEvents()
  }, 300)
}

const applyFilters = () => {
  currentPage.value = 1
  loadEvents()
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
  }
  searchQuery.value = ''
  currentPage.value = 1
  loadEvents()
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= lastPage.value) {
    currentPage.value = page
    loadEvents()
  }
}

const viewEvent = (event: Event) => {
  router.push({ name: 'events-detail', params: { id: event.id } })
}

const editEvent = (event: Event) => {
  router.push({ name: 'events-edit', params: { id: event.id } })
}

const createEvent = () => {
  router.push({ name: 'events-create' })
}

const duplicateEvent = async (event: Event) => {
  try {
    const newEvent = await eventsService.duplicate(event.id)
    toast.success('Evento duplicado com sucesso')
    router.push({ name: 'events-edit', params: { id: newEvent.id } })
  } catch (error) {
    toast.error('Erro ao duplicar evento')
    console.error(error)
  }
}

const deleteEvent = async (event: Event) => {
  if (!confirm(`Deseja realmente excluir "${event.name}"?`)) return

  try {
    await eventsService.delete(event.id)
    events.value = events.value.filter(e => e.id !== event.id)
    toast.success('Evento excluido com sucesso')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Erro ao excluir evento')
    console.error(error)
  }
}

const updateStatus = async (event: Event, status: string) => {
  try {
    const updated = await eventsService.updateStatus(event.id, status)
    const index = events.value.findIndex(e => e.id === event.id)
    if (index !== -1) {
      events.value[index] = updated
    }
    toast.success('Status atualizado')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Erro ao atualizar status')
    console.error(error)
  }
}

// Helpers
const getStatusBadge = (status: string) => {
  const badges: Record<string, { class: string; label: string }> = {
    draft: { class: 'bg-gray-100 text-gray-800', label: 'Rascunho' },
    active: { class: 'bg-green-100 text-green-800', label: 'Ativo' },
    completed: { class: 'bg-blue-100 text-blue-800', label: 'Concluido' },
    canceled: { class: 'bg-red-100 text-red-800', label: 'Cancelado' },
  }
  return badges[status] || { class: 'bg-gray-100 text-gray-800', label: status }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatCurrency = (value?: number) => {
  if (!value) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const getDaysUntil = (startDate: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventDate = new Date(startDate)
  eventDate.setHours(0, 0, 0, 0)
  const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Passado'
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanha'
  return `${diff} dias`
}

// Lifecycle
onMounted(() => {
  loadEvents()
  loadOrganizations()
})

watch(() => filters.value.organization_id, () => {
  applyFilters()
})

watch(() => filters.value.status, () => {
  applyFilters()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Eventos</h1>
        <p class="text-gray-500">Gerencie seus eventos</p>
      </div>
      <button
        v-if="auth.hasPermission('events.create')"
        @click="createEvent"
        class="btn btn-primary flex items-center gap-2"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Novo Evento
      </button>
    </div>

    <!-- Filters -->
    <div class="card mb-6">
      <div class="card-body">
        <!-- Grade de 10 colunas para caber 50/30/20 numa linha so. Sem o
             filtro de organizacao (nao super-admin) a busca ocupa o espaco
             dele, em vez de deixar um vao. -->
        <div class="grid grid-cols-1 md:grid-cols-10 gap-4">
          <!-- Search -->
          <div :class="auth.isSuperAdmin ? 'md:col-span-5' : 'md:col-span-7'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              placeholder="Nome do evento, local..."
              class="input w-full"
            />
          </div>

          <!-- Organização (apenas super-admin) -->
          <div v-if="auth.isSuperAdmin" class="md:col-span-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Organização</label>
            <select v-model="filters.organization_id" class="input w-full">
              <option value="">Todas</option>
              <option v-for="org in organizations" :key="org.id" :value="org.id">
                {{ org.name }}
              </option>
            </select>
          </div>

          <!-- Status -->
          <div :class="auth.isSuperAdmin ? 'md:col-span-2' : 'md:col-span-3'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select v-model="filters.status" class="input w-full">
              <option value="">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="completed">Concluido</option>
              <option value="canceled">Cancelado</option>
            </select>
          </div>
        </div>

        <div v-if="hasFilters" class="mt-4">
          <button @click="clearFilters" class="btn btn-secondary">
            Limpar Filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="mb-4 text-sm text-gray-500">
      {{ total }} evento(s) encontrado(s)
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Events Grid -->
    <div v-else>
      <div v-if="events.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="event in events"
          :key="event.id"
          class="card hover:shadow-lg transition-shadow cursor-pointer"
          @click="viewEvent(event)"
        >
          <div class="card-body">
            <!-- Header -->
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 line-clamp-1">{{ event.name }}</h3>
                <p class="text-sm text-gray-500">{{ event.venue_name || event.address }}</p>
              </div>
              <span
                :class="getStatusBadge(event.status).class"
                class="px-2 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0"
              >
                {{ getStatusBadge(event.status).label }}
              </span>
            </div>

            <!-- Details -->
            <div class="mt-4 space-y-2">
              <div class="flex items-center text-sm text-gray-600">
                <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ formatDate(event.start_date) }}
                <span class="ml-auto text-xs font-medium" :class="getDaysUntil(event.start_date) === 'Passado' ? 'text-gray-400' : 'text-primary-600'">
                  {{ getDaysUntil(event.start_date) }}
                </span>
              </div>

              <div class="flex items-center text-sm text-gray-600">
                <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ event.city }}, {{ event.state }}
              </div>

              <div v-if="event.estimated_budget" class="flex items-center text-sm text-gray-600">
                <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatCurrency(event.estimated_budget) }}
              </div>

              <div v-if="event.expected_attendees" class="flex items-center text-sm text-gray-600">
                <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {{ event.expected_attendees }} participantes
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-2" @click.stop>
              <button
                v-if="auth.hasPermission('events.update')"
                @click="editEvent(event)"
                class="text-gray-400 hover:text-primary-600 p-1"
                title="Editar"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                v-if="auth.hasPermission('events.create')"
                @click="duplicateEvent(event)"
                class="text-gray-400 hover:text-blue-600 p-1"
                title="Duplicar"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <div class="relative group">
                <button class="text-gray-400 hover:text-gray-600 p-1" title="Status">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <button
                    v-if="event.status === 'draft'"
                    @click="updateStatus(event, 'active')"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Ativar evento
                  </button>
                  <button
                    v-if="event.status === 'active'"
                    @click="updateStatus(event, 'completed')"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Marcar como concluido
                  </button>
                  <button
                    v-if="event.status !== 'canceled' && event.status !== 'completed'"
                    @click="updateStatus(event, 'canceled')"
                    class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Cancelar evento
                  </button>
                </div>
              </div>
              <button
                v-if="auth.hasPermission('events.delete')"
                @click="deleteEvent(event)"
                class="text-gray-400 hover:text-red-600 p-1"
                title="Excluir"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-12 card">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhum evento</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ hasFilters ? 'Nenhum evento encontrado com os filtros aplicados.' : 'Comece criando seu primeiro evento.' }}
        </p>
        <div class="mt-6">
          <button v-if="auth.hasPermission('events.create')" @click="createEvent" class="btn btn-primary">
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Novo Evento
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="mt-6 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Pagina <span class="font-medium">{{ currentPage }}</span> de <span class="font-medium">{{ lastPage }}</span>
        </div>
        <div class="flex gap-2">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="btn btn-secondary"
            :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
          >
            Anterior
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === lastPage"
            class="btn btn-secondary"
            :class="{ 'opacity-50 cursor-not-allowed': currentPage === lastPage }"
          >
            Proxima
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
