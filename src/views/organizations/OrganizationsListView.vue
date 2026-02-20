<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dashboardService, { type TopOrganization } from '@/services/dashboard'
import { useToast } from 'vue-toastification'

const toast = useToast()
const organizations = ref<TopOrganization[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    organizations.value = await dashboardService.getTopOrganizations(50)
  } catch (error) {
    toast.error('Erro ao carregar organizacoes')
    console.error(error)
  } finally {
    loading.value = false
  }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const getPlanBadgeClass = (plan: string) => {
  const classes: Record<string, string> = {
    basic: 'bg-gray-100 text-gray-800',
    starter: 'bg-blue-100 text-blue-800',
    professional: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-amber-100 text-amber-800',
  }
  return classes[plan] || 'bg-gray-100 text-gray-800'
}

const getPlanLabel = (plan: string) => {
  const labels: Record<string, string> = {
    basic: 'Basic',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  }
  return labels[plan] || plan
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Organizacoes</h1>
      <p class="text-gray-500">Gerencie as organizacoes da plataforma Orchestra</p>
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
              Organizacao
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Plano
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Localizacao
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Eventos
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usuarios
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              GMV
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="org in organizations" :key="org.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ org.name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="getPlanBadgeClass(org.subscription_plan)"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ getPlanLabel(org.subscription_plan) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ org.city ? `${org.city}, ${org.state}` : org.state || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ org.events_count }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ org.users_count }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ formatCurrency(org.gmv) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-if="organizations.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhuma organizacao</h3>
        <p class="mt-1 text-sm text-gray-500">Nenhuma organizacao cadastrada ainda.</p>
      </div>
    </div>
  </div>
</template>
