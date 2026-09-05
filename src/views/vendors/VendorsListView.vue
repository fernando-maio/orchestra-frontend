<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import vendorsService, { type VendorFilters, type PaginatedVendors } from '@/services/vendors'
import type { Vendor, Category } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

// State
const vendors = ref<Vendor[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = ref(15)

// Filters
const filters = ref<VendorFilters>({
  search: '',
  category_id: '',
  approval_status: '',
  is_active: undefined,
  is_verified: undefined,
})

const searchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Computed
const hasFilters = computed(() => {
  return filters.value.search ||
    filters.value.category_id ||
    filters.value.approval_status ||
    filters.value.is_active !== undefined ||
    filters.value.is_verified !== undefined
})

// Methods
const loadVendors = async () => {
  loading.value = true
  try {
    const result: PaginatedVendors = await vendorsService.list({
      ...filters.value,
      page: currentPage.value,
      per_page: perPage.value,
    })
    vendors.value = result.data
    lastPage.value = result.meta.last_page
    total.value = result.meta.total
  } catch (error) {
    toast.error('Erro ao carregar fornecedores')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    categories.value = await vendorsService.getCategories()
  } catch (error) {
    console.error('Erro ao carregar categorias', error)
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.search = searchQuery.value
    currentPage.value = 1
    loadVendors()
  }, 300)
}

const applyFilters = () => {
  currentPage.value = 1
  loadVendors()
}

const clearFilters = () => {
  filters.value = {
    search: '',
    category_id: '',
    approval_status: '',
    is_active: undefined,
    is_verified: undefined,
  }
  searchQuery.value = ''
  currentPage.value = 1
  loadVendors()
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= lastPage.value) {
    currentPage.value = page
    loadVendors()
  }
}

const viewVendor = (vendor: Vendor) => {
  router.push({ name: 'vendors-detail', params: { id: vendor.id } })
}

const editVendor = (vendor: Vendor) => {
  router.push({ name: 'vendors-edit', params: { id: vendor.id } })
}

const createVendor = () => {
  router.push({ name: 'vendors-create' })
}

const toggleActive = async (vendor: Vendor) => {
  try {
    const updated = await vendorsService.toggleActive(vendor.id)
    const index = vendors.value.findIndex(v => v.id === vendor.id)
    if (index !== -1) {
      vendors.value[index] = updated
    }
    toast.success(updated.is_active ? 'Fornecedor ativado' : 'Fornecedor desativado')
  } catch (error) {
    toast.error('Erro ao alterar status do fornecedor')
    console.error(error)
  }
}

const deleteVendor = async (vendor: Vendor) => {
  if (!confirm(`Deseja realmente excluir "${vendor.trade_name}"?`)) return

  try {
    await vendorsService.delete(vendor.id)
    vendors.value = vendors.value.filter(v => v.id !== vendor.id)
    toast.success('Fornecedor excluído com sucesso')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Erro ao excluir fornecedor')
    console.error(error)
  }
}

// Approval
const showRejectModal = ref(false)
const vendorToReject = ref<Vendor | null>(null)
const rejectReason = ref('')

const approveVendor = async (vendor: Vendor) => {
  if (!confirm(`Aprovar o fornecedor "${vendor.trade_name}"?`)) return

  try {
    const updated = await vendorsService.approve(vendor.id)
    const index = vendors.value.findIndex(v => v.id === vendor.id)
    if (index !== -1) {
      vendors.value[index] = updated
    }
    toast.success('Fornecedor aprovado com sucesso')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Erro ao aprovar fornecedor')
    console.error(error)
  }
}

const openRejectModal = (vendor: Vendor) => {
  vendorToReject.value = vendor
  rejectReason.value = ''
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  vendorToReject.value = null
  rejectReason.value = ''
}

const confirmReject = async () => {
  if (!vendorToReject.value || !rejectReason.value.trim()) {
    toast.error('Informe o motivo da rejeicao')
    return
  }

  try {
    const updated = await vendorsService.reject(vendorToReject.value.id, rejectReason.value)
    const index = vendors.value.findIndex(v => v.id === vendorToReject.value?.id)
    if (index !== -1) {
      vendors.value[index] = updated
    }
    toast.success('Fornecedor rejeitado')
    closeRejectModal()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Erro ao rejeitar fornecedor')
    console.error(error)
  }
}

// Helpers
const getApprovalStatusBadge = (status: string) => {
  const badges: Record<string, { class: string; label: string }> = {
    pending: { class: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
    approved: { class: 'bg-green-100 text-green-800', label: 'Aprovado' },
    rejected: { class: 'bg-red-100 text-red-800', label: 'Rejeitado' },
    suspended: { class: 'bg-gray-100 text-gray-800', label: 'Suspenso' },
  }
  return badges[status] || { class: 'bg-gray-100 text-gray-800', label: status }
}

const TIERS = [
  { value: 'free', label: 'Free' },
  { value: 'featured', label: 'Destaque' },
  { value: 'premium', label: 'Premium' },
] as const

// Guarda o id do fornecedor em gravacao, para desabilitar so o seletor dele.
const tierSaving = ref<string | null>(null)

const changeTier = async (vendor: Vendor, tier: Vendor['subscription_tier']) => {
  if (tier === vendor.subscription_tier) return

  const anterior = vendor.subscription_tier
  tierSaving.value = vendor.id
  try {
    const updated = await vendorsService.updateSubscriptionTier(vendor.id, tier)
    const index = vendors.value.findIndex(v => v.id === vendor.id)
    if (index !== -1) {
      vendors.value[index] = updated
    }
    toast.success(`Plano alterado para ${TIERS.find(t => t.value === tier)?.label}`)
  } catch (error: unknown) {
    // Devolve o valor anterior para o seletor nao ficar mostrando um plano
    // que o servidor recusou.
    vendor.subscription_tier = anterior
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Erro ao alterar o plano')
    console.error(error)
  } finally {
    tierSaving.value = null
  }
}

const getSubscriptionBadge = (tier: string) => {
  const badges: Record<string, { class: string; label: string }> = {
    free: { class: 'bg-gray-100 text-gray-600', label: 'Free' },
    featured: { class: 'bg-blue-100 text-blue-800', label: 'Destaque' },
    premium: { class: 'bg-purple-100 text-purple-800', label: 'Premium' },
  }
  return badges[tier] || { class: 'bg-gray-100 text-gray-600', label: tier }
}

const formatRating = (rating: number) => {
  return rating?.toFixed(1) || '0.0'
}

// Lifecycle
onMounted(() => {
  loadCategories()
  loadVendors()
})

watch([() => filters.value.category_id, () => filters.value.approval_status], () => {
  applyFilters()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Fornecedores</h1>
        <p class="text-gray-500">Gerencie os fornecedores do marketplace</p>
      </div>
      <button
        v-if="auth.hasPermission('vendors.create')"
        @click="createVendor"
        class="btn btn-primary flex items-center gap-2"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Novo Fornecedor
      </button>
    </div>

    <!-- Filters -->
    <div class="card mb-6">
      <div class="card-body">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Search -->
          <div class="lg:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              placeholder="Nome, CNPJ, email..."
              class="input w-full"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select v-model="filters.category_id" class="input w-full">
              <option value="">Todas</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <!-- Approval Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select v-model="filters.approval_status" class="input w-full">
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
              <option value="suspended">Suspenso</option>
            </select>
          </div>

          <!-- Clear Filters -->
          <div class="flex items-end">
            <button
              v-if="hasFilters"
              @click="clearFilters"
              class="btn btn-secondary w-full"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="mb-4 text-sm text-gray-500">
      {{ total }} fornecedor(es) encontrado(s)
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Table -->
    <div v-else class="card overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fornecedor
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categorias
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Localização
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avaliação
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Plano
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="vendor in vendors" :key="vendor.id" class="hover:bg-gray-50">
            <!-- Vendor Info -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span class="text-primary-600 font-medium text-sm">
                      {{ vendor.trade_name.substring(0, 2).toUpperCase() }}
                    </span>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {{ vendor.trade_name }}
                    <svg v-if="vendor.is_verified" class="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="text-sm text-gray-500">{{ vendor.email || vendor.cnpj || '-' }}</div>
                </div>
              </div>
            </td>

            <!-- Categories -->
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="cat in (vendor.categories || []).slice(0, 2)"
                  :key="cat.id"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {{ cat.name }}
                </span>
                <span
                  v-if="(vendor.categories || []).length > 2"
                  class="text-xs text-gray-500"
                >
                  +{{ (vendor.categories || []).length - 2 }}
                </span>
              </div>
            </td>

            <!-- Location -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ vendor.city ? `${vendor.city}, ${vendor.state}` : vendor.state || '-' }}
            </td>

            <!-- Rating -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <svg class="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span class="ml-1 text-sm font-medium text-gray-900">{{ formatRating(vendor.average_rating) }}</span>
                <span class="ml-1 text-sm text-gray-500">({{ vendor.total_ratings }})</span>
              </div>
            </td>

            <!-- Approval Status -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="getApprovalStatusBadge(vendor.approval_status).class"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ getApprovalStatusBadge(vendor.approval_status).label }}
              </span>
              <span
                v-if="!vendor.is_active"
                class="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800"
              >
                Inativo
              </span>
            </td>

            <!-- Subscription -->
            <td class="px-6 py-4 whitespace-nowrap">
              <select
                v-if="auth.hasPermission('vendors.update')"
                :value="vendor.subscription_tier"
                :disabled="tierSaving === vendor.id"
                :class="getSubscriptionBadge(vendor.subscription_tier).class"
                class="text-xs font-semibold rounded-full border-0 py-1 pl-2 pr-7 cursor-pointer focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-wait"
                :aria-label="`Plano de ${vendor.trade_name}`"
                @change="changeTier(vendor, ($event.target as HTMLSelectElement).value as Vendor['subscription_tier'])"
              >
                <option v-for="t in TIERS" :key="t.value" :value="t.value">
                  {{ t.label }}
                </option>
              </select>
              <span
                v-else
                :class="getSubscriptionBadge(vendor.subscription_tier).class"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ getSubscriptionBadge(vendor.subscription_tier).label }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end gap-2">
                <!-- Approve/Reject for pending vendors -->
                <template v-if="vendor.approval_status === 'pending' && auth.hasPermission('vendors.approve')">
                  <button
                    @click="approveVendor(vendor)"
                    class="text-green-600 hover:text-green-700"
                    title="Aprovar"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    @click="openRejectModal(vendor)"
                    class="text-red-600 hover:text-red-700"
                    title="Rejeitar"
                  >
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </template>
                <button
                  @click="viewVendor(vendor)"
                  class="text-gray-400 hover:text-gray-600"
                  title="Ver detalhes"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  v-if="auth.hasPermission('vendors.update')"
                  @click="editVendor(vendor)"
                  class="text-gray-400 hover:text-primary-600"
                  title="Editar"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  v-if="auth.hasPermission('vendors.update')"
                  @click="toggleActive(vendor)"
                  :class="vendor.is_active ? 'text-gray-400 hover:text-yellow-600' : 'text-yellow-600 hover:text-yellow-700'"
                  :title="vendor.is_active ? 'Desativar' : 'Ativar'"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path v-if="vendor.is_active" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  v-if="auth.hasPermission('vendors.delete')"
                  @click="deleteVendor(vendor)"
                  class="text-gray-400 hover:text-red-600"
                  title="Excluir"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-if="vendors.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhum fornecedor</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ hasFilters ? 'Nenhum fornecedor encontrado com os filtros aplicados.' : 'Comece cadastrando o primeiro fornecedor.' }}
        </p>
        <div class="mt-6">
          <button @click="createVendor" class="btn btn-primary">
            <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Novo Fornecedor
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Mostrando pagina <span class="font-medium">{{ currentPage }}</span> de <span class="font-medium">{{ lastPage }}</span>
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

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black opacity-50" @click="closeRejectModal"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Rejeitar Fornecedor
          </h3>
          <p class="text-sm text-gray-500 mb-4">
            Informe o motivo da rejeicao para <strong>{{ vendorToReject?.trade_name }}</strong>.
            O fornecedor sera notificado por e-mail.
          </p>
          <textarea
            v-model="rejectReason"
            rows="4"
            class="input w-full"
            placeholder="Motivo da rejeicao..."
          ></textarea>
          <div class="mt-4 flex justify-end gap-3">
            <button @click="closeRejectModal" class="btn btn-secondary">
              Cancelar
            </button>
            <button @click="confirmReject" class="btn bg-red-600 text-white hover:bg-red-700">
              Rejeitar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
