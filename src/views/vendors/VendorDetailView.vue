<script setup lang="ts">
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import vendorsService from '@/services/vendors'
import type { Vendor } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// State
const vendor = ref<Vendor | null>(null)
const compliance = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const actionLoading = ref(false)

// Reject modal
const showRejectModal = ref(false)
const rejectReason = ref('')
const rejectLoading = ref(false)

// Computed
const vendorId = computed(() => route.params.id as string)

const approvalBadge = computed(() => {
  if (!vendor.value) return { class: '', label: '' }
  const badges: Record<string, { class: string; label: string }> = {
    pending: { class: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
    approved: { class: 'bg-green-100 text-green-800', label: 'Aprovado' },
    rejected: { class: 'bg-red-100 text-red-800', label: 'Rejeitado' },
    suspended: { class: 'bg-gray-100 text-gray-800', label: 'Suspenso' },
  }
  return badges[vendor.value.approval_status] || { class: 'bg-gray-100 text-gray-800', label: vendor.value.approval_status }
})

const subscriptionBadge = computed(() => {
  if (!vendor.value) return { class: '', label: '' }
  const badges: Record<string, { class: string; label: string }> = {
    free: { class: 'bg-gray-100 text-gray-600', label: 'Free' },
    featured: { class: 'bg-blue-100 text-blue-800', label: 'Destaque' },
    premium: { class: 'bg-purple-100 text-purple-800', label: 'Premium' },
  }
  return badges[vendor.value.subscription_tier] || { class: 'bg-gray-100 text-gray-600', label: vendor.value.subscription_tier }
})

const sourceBadge = computed(() => {
  if (!vendor.value) return { class: '', label: '' }
  const badges: Record<string, { class: string; label: string }> = {
    self_register: { class: 'bg-blue-100 text-blue-800', label: 'Auto-cadastro' },
    import: { class: 'bg-indigo-100 text-indigo-800', label: 'Importacao' },
    invite: { class: 'bg-teal-100 text-teal-800', label: 'Convite' },
    admin: { class: 'bg-gray-100 text-gray-800', label: 'Admin' },
  }
  return badges[vendor.value.source] || { class: 'bg-gray-100 text-gray-800', label: vendor.value.source }
})

const isPending = computed(() => vendor.value?.approval_status === 'pending')

const fullStars = computed(() => Math.floor(vendor.value?.average_rating ?? 0))
const hasHalfStar = computed(() => (vendor.value?.average_rating ?? 0) % 1 >= 0.5)
const emptyStars = computed(() => 5 - fullStars.value - (hasHalfStar.value ? 1 : 0))

const locationString = computed(() => {
  if (!vendor.value) return '-'
  const parts: string[] = []
  if (vendor.value.address) parts.push(vendor.value.address)
  if (vendor.value.city) parts.push(vendor.value.city)
  if (vendor.value.state) parts.push(vendor.value.state)
  if (vendor.value.zip_code) parts.push(vendor.value.zip_code)
  return parts.join(', ') || '-'
})

// Methods
const loadVendor = async () => {
  loading.value = true
  error.value = null
  try {
    vendor.value = await vendorsService.get(vendorId.value)
  } catch (err: unknown) {
    const apiErr = err as { response?: { status?: number; data?: { message?: string } } }
    if (apiErr.response?.status === 404) {
      error.value = 'Fornecedor nao encontrado.'
    } else {
      error.value = apiErr.response?.data?.message || 'Erro ao carregar fornecedor.'
    }
    console.error(err)
  } finally {
    loading.value = false
  }
}

const loadCompliance = async () => {
  try {
    compliance.value = await vendorsService.getCompliance(vendorId.value)
  } catch (err) {
    // Compliance data might not be available for all vendors
    console.error('Erro ao carregar compliance:', err)
    compliance.value = null
  }
}

const approveVendor = async () => {
  if (!vendor.value) return
  if (!confirm(`Aprovar o fornecedor "${vendor.value.trade_name}"?`)) return

  actionLoading.value = true
  try {
    vendor.value = await vendorsService.approve(vendor.value.id)
    toast.success('Fornecedor aprovado com sucesso')
  } catch (err: unknown) {
    const apiErr = err as { response?: { data?: { message?: string } } }
    toast.error(apiErr.response?.data?.message || 'Erro ao aprovar fornecedor')
    console.error(err)
  } finally {
    actionLoading.value = false
  }
}

const openRejectModal = () => {
  rejectReason.value = ''
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  rejectReason.value = ''
}

const confirmReject = async () => {
  if (!vendor.value || !rejectReason.value.trim()) {
    toast.error('Informe o motivo da rejeicao')
    return
  }

  rejectLoading.value = true
  try {
    vendor.value = await vendorsService.reject(vendor.value.id, rejectReason.value)
    toast.success('Fornecedor rejeitado')
    closeRejectModal()
  } catch (err: unknown) {
    const apiErr = err as { response?: { data?: { message?: string } } }
    toast.error(apiErr.response?.data?.message || 'Erro ao rejeitar fornecedor')
    console.error(err)
  } finally {
    rejectLoading.value = false
  }
}

const verifyVendor = async () => {
  if (!vendor.value) return

  actionLoading.value = true
  try {
    vendor.value = await vendorsService.verify(vendor.value.id)
    toast.success('Fornecedor verificado com sucesso')
  } catch (err: unknown) {
    const apiErr = err as { response?: { data?: { message?: string } } }
    toast.error(apiErr.response?.data?.message || 'Erro ao verificar fornecedor')
    console.error(err)
  } finally {
    actionLoading.value = false
  }
}

const toggleActive = async () => {
  if (!vendor.value) return

  actionLoading.value = true
  try {
    vendor.value = await vendorsService.toggleActive(vendor.value.id)
    toast.success(vendor.value.is_active ? 'Fornecedor ativado' : 'Fornecedor desativado')
  } catch (err: unknown) {
    const apiErr = err as { response?: { data?: { message?: string } } }
    toast.error(apiErr.response?.data?.message || 'Erro ao alterar status do fornecedor')
    console.error(err)
  } finally {
    actionLoading.value = false
  }
}

const deleteVendor = async () => {
  if (!vendor.value) return
  if (!confirm(`Deseja realmente excluir "${vendor.value.trade_name}"? Esta acao nao pode ser desfeita.`)) return

  actionLoading.value = true
  try {
    await vendorsService.delete(vendor.value.id)
    toast.success('Fornecedor excluído com sucesso')
    router.push({ name: 'vendors' })
  } catch (err: unknown) {
    const apiErr = err as { response?: { data?: { message?: string } } }
    toast.error(apiErr.response?.data?.message || 'Erro ao excluir fornecedor')
    console.error(err)
  } finally {
    actionLoading.value = false
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const formatCnpj = (cnpj?: string) => {
  if (!cnpj) return '-'
  // Format as XX.XXX.XXX/XXXX-XX if raw
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length === 14) {
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }
  return cnpj
}

// A API devolve { is_compliant, documents: { chave: {...} }, total_documents }.
// `documents` e um OBJETO com chave por tipo de documento, e nao um array - o
// template antes testava Array.isArray e caia num dump generico, imprimindo o
// JSON cru na tela.
interface DocumentoCompliance {
  chave: string
  label: string
  rotulo: string
  uploadedAt: string | null
  expiryDate: string | null
  cor: { badge: string; icone: string }
}

const complianceInfo = computed(() => {
  const bruto = (compliance.value ?? {}) as Record<string, unknown>
  const docsBrutos = (bruto.documents ?? {}) as Record<string, Record<string, unknown>>

  const documentos: DocumentoCompliance[] = Object.entries(docsBrutos).map(
    ([chave, doc]) => {
      const status = String(doc.status ?? 'missing')
      const vencido = Boolean(doc.is_expired)

      const { rotulo, cor } = vencido
        ? { rotulo: 'Vencido', cor: { badge: 'bg-red-100 text-red-800', icone: 'text-red-400' } }
        : status === 'valid' || status === 'approved'
          ? { rotulo: 'Válido', cor: { badge: 'bg-green-100 text-green-800', icone: 'text-green-500' } }
          : status === 'pending'
            ? { rotulo: 'Em análise', cor: { badge: 'bg-yellow-100 text-yellow-800', icone: 'text-yellow-500' } }
            : status === 'rejected'
              ? { rotulo: 'Rejeitado', cor: { badge: 'bg-red-100 text-red-800', icone: 'text-red-400' } }
              : { rotulo: 'Não enviado', cor: { badge: 'bg-gray-100 text-gray-600', icone: 'text-gray-300' } }

      return {
        chave,
        label: String(doc.label ?? chave),
        rotulo,
        uploadedAt: (doc.uploaded_at as string | null) ?? null,
        expiryDate: (doc.expiry_date as string | null) ?? null,
        cor,
      }
    },
  )

  return {
    isCompliant: Boolean(bruto.is_compliant),
    documentos,
    enviados: documentos.filter(d => d.rotulo !== 'Não enviado').length,
  }
})

// Lifecycle
onMounted(() => {
  loadVendor()
  loadCompliance()
})
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <svg class="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="max-w-lg mx-auto py-16 text-center">
      <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <h2 class="mt-4 text-xl font-semibold text-gray-900">{{ error }}</h2>
      <p class="mt-2 text-gray-500">O fornecedor solicitado nao foi encontrado ou ocorreu um erro.</p>
      <div class="mt-6">
        <router-link :to="{ name: 'vendors' }" class="btn btn-primary">
          Voltar para Fornecedores
        </router-link>
      </div>
    </div>

    <!-- Vendor detail -->
    <template v-else-if="vendor">
      <!-- Header -->
      <div class="mb-6">
        <!-- Breadcrumb -->
        <nav class="mb-4">
          <ol class="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <router-link :to="{ name: 'vendors' }" class="hover:text-gray-700">Fornecedores</router-link>
            </li>
            <li>
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li class="text-gray-900 font-medium">{{ vendor.trade_name }}</li>
          </ol>
        </nav>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <!-- Avatar -->
            <div class="shrink-0 h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-primary-600 font-bold text-lg">
                {{ vendor.trade_name.substring(0, 2).toUpperCase() }}
              </span>
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-bold text-gray-900">{{ vendor.trade_name }}</h1>
                <!-- Verified badge -->
                <svg v-if="vendor.is_verified" class="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20" title="Verificado">
                  <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <!-- Approval status badge -->
                <span
                  :class="approvalBadge.class"
                  class="badge"
                >
                  {{ approvalBadge.label }}
                </span>
                <!-- Subscription badge -->
                <span
                  :class="subscriptionBadge.class"
                  class="badge"
                >
                  {{ subscriptionBadge.label }}
                </span>
                <!-- Source badge -->
                <span
                  :class="sourceBadge.class"
                  class="badge"
                >
                  {{ sourceBadge.label }}
                </span>
                <!-- Active/Inactive indicator -->
                <span
                  v-if="!vendor.is_active"
                  class="badge bg-red-100 text-red-800"
                >
                  Inativo
                </span>
              </div>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <router-link
              :to="{ name: 'vendors-edit', params: { id: vendor.id } }"
              class="btn btn-secondary"
            >
              <svg class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </router-link>

            <!-- Approve (pending only) -->
            <button
              v-if="isPending"
              @click="approveVendor"
              :disabled="actionLoading"
              class="btn btn-success"
            >
              <svg class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Aprovar
            </button>

            <!-- Reject (pending only) -->
            <button
              v-if="isPending"
              @click="openRejectModal"
              :disabled="actionLoading"
              class="btn btn-danger"
            >
              <svg class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rejeitar
            </button>

            <!-- Verify -->
            <button
              v-if="!vendor.is_verified"
              @click="verifyVendor"
              :disabled="actionLoading"
              class="btn bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
            >
              <svg class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verificar
            </button>

            <!-- Toggle Active -->
            <button
              @click="toggleActive"
              :disabled="actionLoading"
              :class="vendor.is_active
                ? 'btn bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
                : 'btn btn-success'"
            >
              <svg class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path v-if="vendor.is_active" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ vendor.is_active ? 'Desativar' : 'Ativar' }}
            </button>

            <!-- Delete -->
            <button
              @click="deleteVendor"
              :disabled="actionLoading"
              class="btn btn-danger"
            >
              <svg class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Excluir
            </button>
          </div>
        </div>
      </div>

      <!-- Rejection reason alert -->
      <div
        v-if="vendor.approval_status === 'rejected' && vendor.rejection_reason"
        class="mb-6 p-4 rounded-lg bg-red-50 border border-red-200"
      >
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 class="text-sm font-semibold text-red-800">Motivo da Rejeicao</h4>
            <p class="mt-1 text-sm text-red-700">{{ vendor.rejection_reason }}</p>
          </div>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Email -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 rounded-lg">
              <svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-500 font-medium">Email</p>
              <p class="text-sm font-semibold text-gray-900 truncate">{{ vendor.email || '-' }}</p>
            </div>
          </div>
        </div>

        <!-- Phone -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 rounded-lg">
              <svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-500 font-medium">Telefone</p>
              <p class="text-sm font-semibold text-gray-900 truncate">{{ vendor.phone || '-' }}</p>
              <p v-if="vendor.whatsapp" class="text-xs text-gray-500 truncate">WhatsApp: {{ vendor.whatsapp }}</p>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-100 rounded-lg">
              <svg class="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-500 font-medium">Localização</p>
              <p class="text-sm font-semibold text-gray-900 truncate">
                {{ vendor.city ? `${vendor.city}, ${vendor.state}` : vendor.state || '-' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Rating -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-yellow-100 rounded-lg">
              <svg class="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <p class="text-xs text-gray-500 font-medium">Avaliação</p>
              <div class="flex items-center gap-1.5">
                <div class="flex items-center">
                  <!-- Full stars -->
                  <svg
                    v-for="n in fullStars"
                    :key="'full-' + n"
                    class="h-4 w-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <!-- Half star -->
                  <svg
                    v-if="hasHalfStar"
                    class="h-4 w-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <defs>
                      <linearGradient id="half-star">
                        <stop offset="50%" stop-color="currentColor" />
                        <stop offset="50%" stop-color="#d1d5db" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <!-- Empty stars -->
                  <svg
                    v-for="n in emptyStars"
                    :key="'empty-' + n"
                    class="h-4 w-4 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <span class="text-sm font-semibold text-gray-900">{{ vendor.average_rating?.toFixed(1) || '0.0' }}</span>
                <span class="text-xs text-gray-500">({{ vendor.total_ratings }} avaliações)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Details and Categories -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Details card -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">Detalhes</h3>
          </div>
          <div class="p-6">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <dt class="text-sm font-medium text-gray-500">Razão Social</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ vendor.legal_name || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">CNPJ</dt>
                <dd class="mt-1 text-sm text-gray-900 font-mono">{{ formatCnpj(vendor.cnpj) }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Website</dt>
                <dd class="mt-1 text-sm">
                  <a
                    v-if="vendor.website"
                    :href="vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    {{ vendor.website }}
                  </a>
                  <span v-else class="text-gray-900">-</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Raio de Atendimento</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ vendor.service_radius_km ? `${vendor.service_radius_km} km` : '-' }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-sm font-medium text-gray-500">Endereço Completo</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ locationString }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-sm font-medium text-gray-500">Descrição</dt>
                <dd class="mt-1 text-sm text-gray-900 whitespace-pre-line">{{ vendor.description || 'Nenhuma descrição informada.' }}</dd>
              </div>
            </dl>

            <!-- Tags / Attributes -->
            <div class="mt-6 pt-5 border-t border-gray-100">
              <h4 class="text-sm font-medium text-gray-500 mb-3">Atributos</h4>
              <div class="flex flex-wrap gap-2">
                <span v-if="vendor.accepts_urgent" class="badge bg-orange-100 text-orange-800">
                  Aceita Urgencias
                </span>
                <span v-if="vendor.is_local_business" class="badge bg-teal-100 text-teal-800">
                  Negocio Local
                </span>
                <span v-if="vendor.is_sustainable" class="badge bg-emerald-100 text-emerald-800">
                  Sustentavel
                </span>
                <span v-if="vendor.is_minority_owned" class="badge bg-violet-100 text-violet-800">
                  Diversidade
                </span>
                <span v-if="!vendor.accepts_urgent && !vendor.is_local_business && !vendor.is_sustainable && !vendor.is_minority_owned" class="text-sm text-gray-400">
                  Nenhum atributo definido
                </span>
              </div>
            </div>

            <!-- Contact person -->
            <div v-if="vendor.contact_name || vendor.contact_email || vendor.contact_phone" class="mt-6 pt-5 border-t border-gray-100">
              <h4 class="text-sm font-medium text-gray-500 mb-3">Pessoa de Contato</h4>
              <dl class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div v-if="vendor.contact_name">
                  <dt class="text-xs text-gray-500">Nome</dt>
                  <dd class="text-sm text-gray-900">{{ vendor.contact_name }}</dd>
                </div>
                <div v-if="vendor.contact_email">
                  <dt class="text-xs text-gray-500">Email</dt>
                  <dd class="text-sm text-gray-900">{{ vendor.contact_email }}</dd>
                </div>
                <div v-if="vendor.contact_phone">
                  <dt class="text-xs text-gray-500">Telefone</dt>
                  <dd class="text-sm text-gray-900">{{ vendor.contact_phone }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <!-- Categories card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900">Categorias</h3>
          </div>
          <div class="p-6">
            <div v-if="vendor.categories && vendor.categories.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="cat in vendor.categories"
                :key="cat.id"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-800"
              >
                <!-- cat.icon guarda o NOME do ícone (ex.: "bolt"), não o
                     símbolo. Interpolá-lo direto imprimia "bolt" na tela. -->
                <CategoryIcon v-if="cat.icon" :name="cat.icon" :size="16" />
                <span
                  v-else-if="cat.color"
                  class="w-2 h-2 rounded-full shrink-0"
                  :style="{ backgroundColor: cat.color }"
                ></span>
                {{ cat.name }}
              </span>
            </div>
            <div v-else class="text-center py-6">
              <svg class="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p class="mt-2 text-sm text-gray-500">Nenhuma categoria atribuida</p>
            </div>
          </div>

          <!-- Metadata -->
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-500">Cadastrado em</dt>
                <dd class="text-gray-900">{{ formatDate(vendor.created_at) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Atualizado em</dt>
                <dd class="text-gray-900">{{ formatDate(vendor.updated_at) }}</dd>
              </div>
              <div v-if="vendor.approved_at" class="flex justify-between">
                <dt class="text-gray-500">Aprovado em</dt>
                <dd class="text-gray-900">{{ formatDate(vendor.approved_at) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <!-- Compliance section -->
      <div v-if="compliance" class="mb-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 class="text-lg font-semibold text-gray-900">Compliance</h3>
        </div>
        <div class="p-6">
          <!-- Situação geral -->
          <div class="mb-5 flex items-center gap-3">
            <span
              class="badge"
              :class="complianceInfo.isCompliant
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'"
            >
              {{ complianceInfo.isCompliant ? 'Em conformidade' : 'Pendências' }}
            </span>
            <span class="text-sm text-gray-500">
              {{ complianceInfo.enviados }} de {{ complianceInfo.documentos.length }}
              documento(s) enviado(s)
            </span>
          </div>

          <!-- Documentos exigidos -->
          <div class="space-y-3">
            <div
              v-for="doc in complianceInfo.documentos"
              :key="doc.chave"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-200"
            >
              <div class="flex items-center gap-3">
                <svg class="h-5 w-5 shrink-0" :class="doc.cor.icone" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ doc.label }}</p>
                  <p v-if="doc.expiryDate" class="text-xs text-gray-500">
                    Vence em {{ formatDate(doc.expiryDate) }}
                  </p>
                  <p v-else-if="doc.uploadedAt" class="text-xs text-gray-500">
                    Enviado em {{ formatDate(doc.uploadedAt) }}
                  </p>
                </div>
              </div>
              <span class="badge" :class="doc.cor.badge">{{ doc.rotulo }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black opacity-50" @click="closeRejectModal"></div>
        <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            Rejeitar Fornecedor
          </h3>
          <p class="text-sm text-gray-500 mb-4">
            Informe o motivo da rejeicao para <strong>{{ vendor?.trade_name }}</strong>.
            O fornecedor sera notificado por e-mail.
          </p>
          <div>
            <label for="reject-reason" class="label">Motivo da Rejeicao</label>
            <textarea
              id="reject-reason"
              v-model="rejectReason"
              rows="4"
              class="input"
              placeholder="Informe o motivo da rejeicao..."
            ></textarea>
          </div>
          <div class="mt-5 flex justify-end gap-3">
            <button
              @click="closeRejectModal"
              :disabled="rejectLoading"
              class="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              @click="confirmReject"
              :disabled="rejectLoading || !rejectReason.trim()"
              class="btn btn-danger"
            >
              <svg v-if="rejectLoading" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Rejeitar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
