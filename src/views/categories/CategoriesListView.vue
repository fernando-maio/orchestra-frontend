<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import { computed, onMounted, ref } from 'vue'
import api from '@/services/api'
import { useToast } from 'vue-toastification'

interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  is_active: boolean
  sort_order: number
  vendors_count?: number
}

const toast = useToast()
const categories = ref<Category[]>([])
const loading = ref(true)
const auth = useAuthStore()
const podeEditar = computed(() => auth.hasPermission('categories.update'))

onMounted(async () => {
  try {
    const response = await api.get('/categories')
    categories.value = response.data.data
  } catch (error) {
    toast.error('Erro ao carregar categorias')
    console.error(error)
  } finally {
    loading.value = false
  }
})

const toggleActive = async (category: Category) => {
  try {
    await api.post(`/categories/${category.id}/toggle-active`)
    category.is_active = !category.is_active
    toast.success(`Categoria ${category.is_active ? 'ativada' : 'desativada'}`)
  } catch (error) {
    toast.error('Erro ao alterar status')
    console.error(error)
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Categorias</h1>
        <p class="text-gray-500">Categorias de fornecedores disponiveis na plataforma</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="category in categories"
        :key="category.id"
        class="card p-4 hover:shadow-md transition-shadow"
        :class="{ 'opacity-50': !category.is_active }"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
              :style="{ backgroundColor: category.color || '#6366f1' }"
            >
              <CategoryIcon :name="category.icon" />
            </div>
            <div>
              <h3 class="font-medium text-gray-900">{{ category.name }}</h3>
              <p class="text-sm text-gray-500">
                {{ category.vendors_count || 0 }}
                {{ category.vendors_count === 1 ? 'fornecedor' : 'fornecedores' }}
              </p>
            </div>
          </div>
          <!-- Só o super-admin tem categories.update. Sem o gate, admin,
               organizer e viewer viam o botão e levavam 403 ao clicar. -->
          <button
            :disabled="!podeEditar"
            :title="podeEditar ? (category.is_active ? 'Desativar' : 'Ativar') : 'Somente a plataforma altera categorias'"
            @click="toggleActive(category)"
            :class="[
              'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              podeEditar ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
              category.is_active ? 'bg-primary-600' : 'bg-gray-200',
            ]"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                category.is_active ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </button>
        </div>
        <p v-if="category.description" class="mt-3 text-sm text-gray-600">
          {{ category.description }}
        </p>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && categories.length === 0" class="text-center py-12 card">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">Nenhuma categoria</h3>
      <p class="mt-1 text-sm text-gray-500">Nenhuma categoria cadastrada ainda.</p>
    </div>
  </div>
</template>
