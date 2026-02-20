<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import vendorsService, { type VendorFormData } from '@/services/vendors'
import type { Category } from '@/types'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Mode detection
const vendorId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!vendorId.value)
const pageTitle = computed(() => isEditMode.value ? 'Editar Fornecedor' : 'Novo Fornecedor')

// State
const categories = ref<Category[]>([])
const loading = ref(false)
const submitting = ref(false)

// Form data
const form = reactive<VendorFormData>({
  trade_name: '',
  legal_name: '',
  cnpj: '',
  email: '',
  phone: '',
  website: '',
  description: '',
  city: '',
  state: '',
  zip_code: '',
  service_radius_km: 50,
  category_ids: [],
})

// Validation errors
const errors = reactive<Record<string, string>>({})

// Brazilian states
const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

// Methods
const loadCategories = async () => {
  try {
    categories.value = await vendorsService.getCategories()
  } catch (error) {
    toast.error('Erro ao carregar categorias')
    console.error(error)
  }
}

const loadVendor = async () => {
  if (!vendorId.value) return

  loading.value = true
  try {
    const vendor = await vendorsService.get(vendorId.value)

    form.trade_name = vendor.trade_name || ''
    form.legal_name = vendor.legal_name || ''
    form.cnpj = vendor.cnpj || ''
    form.email = vendor.email || ''
    form.phone = vendor.phone || ''
    form.website = vendor.website || ''
    form.description = vendor.description || ''
    form.city = vendor.city || ''
    form.state = vendor.state || ''
    form.zip_code = vendor.zip_code || ''
    form.service_radius_km = vendor.service_radius_km ?? 50
    form.category_ids = vendor.categories?.map(c => c.id) || []
  } catch (error) {
    toast.error('Erro ao carregar fornecedor')
    console.error(error)
    router.push({ name: 'vendors' })
  } finally {
    loading.value = false
  }
}

const formatCnpj = (value: string) => {
  const numbers = value.replaceAll(/\D/g, '')
  if (numbers.length <= 14) {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return value
}

const handleCnpjInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  form.cnpj = formatCnpj(input.value)
}

const toggleCategory = (categoryId: string) => {
  if (!form.category_ids) {
    form.category_ids = []
  }
  const index = form.category_ids.indexOf(categoryId)
  if (index === -1) {
    form.category_ids.push(categoryId)
  } else {
    form.category_ids.splice(index, 1)
  }
}

const validate = (): boolean => {
  // Clear errors
  Object.keys(errors).forEach(key => delete errors[key])

  if (!form.trade_name?.trim()) errors.trade_name = 'Nome fantasia e obrigatorio'
  if (!form.email?.trim()) errors.email = 'E-mail e obrigatorio'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'E-mail invalido'
  }
  if (!form.city?.trim()) errors.city = 'Cidade e obrigatoria'
  if (!form.state) errors.state = 'Estado e obrigatorio'

  return Object.keys(errors).length === 0
}

const submit = async () => {
  if (!validate()) return

  submitting.value = true
  try {
    if (isEditMode.value) {
      await vendorsService.update(vendorId.value!, form)
      toast.success('Fornecedor atualizado com sucesso')
    } else {
      await vendorsService.create(form)
      toast.success('Fornecedor criado com sucesso')
    }
    router.push({ name: 'vendors' })
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    if (err.response?.data?.errors) {
      Object.entries(err.response.data.errors).forEach(([key, messages]) => {
        errors[key] = messages[0] ?? ''
      })
    } else {
      toast.error(err.response?.data?.message || 'Erro ao salvar fornecedor')
    }
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const cancel = () => {
  router.push({ name: 'vendors' })
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  await loadCategories()
  if (isEditMode.value) {
    await loadVendor()
  } else {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h1>
        <p class="text-gray-500">
          {{ isEditMode ? 'Atualize as informacoes do fornecedor' : 'Preencha os dados para cadastrar um novo fornecedor' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="submit">
      <!-- Basic Info -->
      <div class="card mb-6">
        <div class="card-body">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Dados da Empresa</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Trade Name -->
            <div class="md:col-span-2">
              <label for="trade_name" class="block text-sm font-medium text-gray-700 mb-1">
                Nome Fantasia <span class="text-red-500">*</span>
              </label>
              <input
                id="trade_name"
                v-model="form.trade_name"
                type="text"
                class="form-input w-full"
                :class="{ 'border-red-500': errors.trade_name }"
                placeholder="Nome da empresa"
              />
              <p v-if="errors.trade_name" class="text-red-500 text-sm mt-1">{{ errors.trade_name }}</p>
            </div>

            <!-- Legal Name -->
            <div class="md:col-span-2">
              <label for="legal_name" class="block text-sm font-medium text-gray-700 mb-1">Razao Social</label>
              <input
                id="legal_name"
                v-model="form.legal_name"
                type="text"
                class="form-input w-full"
                placeholder="Razao social (opcional)"
              />
            </div>

            <!-- CNPJ -->
            <div>
              <label for="cnpj" class="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input
                id="cnpj"
                :value="form.cnpj"
                @input="handleCnpjInput"
                type="text"
                class="form-input w-full"
                :class="{ 'border-red-500': errors.cnpj }"
                placeholder="00.000.000/0000-00"
                maxlength="18"
              />
              <p v-if="errors.cnpj" class="text-red-500 text-sm mt-1">{{ errors.cnpj }}</p>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                E-mail <span class="text-red-500">*</span>
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-input w-full"
                :class="{ 'border-red-500': errors.email }"
                placeholder="empresa@exemplo.com"
              />
              <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
            </div>

            <!-- Phone -->
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                id="phone"
                v-model="form.phone"
                type="text"
                class="form-input w-full"
                placeholder="(00) 0000-0000"
                maxlength="15"
              />
            </div>

            <!-- Website -->
            <div>
              <label for="website" class="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                id="website"
                v-model="form.website"
                type="url"
                class="form-input w-full"
                placeholder="https://www.empresa.com.br"
              />
            </div>

            <!-- Description -->
            <div class="md:col-span-2">
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
              <textarea
                id="description"
                v-model="form.description"
                rows="3"
                class="form-input w-full"
                placeholder="Descreva a empresa, servicos oferecidos, diferenciais..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Location -->
      <div class="card mb-6">
        <div class="card-body">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Localizacao</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- City -->
            <div>
              <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
                Cidade <span class="text-red-500">*</span>
              </label>
              <input
                id="city"
                v-model="form.city"
                type="text"
                class="form-input w-full"
                :class="{ 'border-red-500': errors.city }"
                placeholder="Cidade"
              />
              <p v-if="errors.city" class="text-red-500 text-sm mt-1">{{ errors.city }}</p>
            </div>

            <!-- State -->
            <div>
              <label for="state" class="block text-sm font-medium text-gray-700 mb-1">
                Estado <span class="text-red-500">*</span>
              </label>
              <select
                id="state"
                v-model="form.state"
                class="form-select w-full"
                :class="{ 'border-red-500': errors.state }"
              >
                <option value="">Selecione</option>
                <option v-for="uf in states" :key="uf" :value="uf">{{ uf }}</option>
              </select>
              <p v-if="errors.state" class="text-red-500 text-sm mt-1">{{ errors.state }}</p>
            </div>

            <!-- ZIP Code -->
            <div>
              <label for="zip_code" class="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                id="zip_code"
                v-model="form.zip_code"
                type="text"
                class="form-input w-full"
                placeholder="00000-000"
                maxlength="9"
              />
            </div>

            <!-- Service Radius -->
            <div>
              <label for="service_radius_km" class="block text-sm font-medium text-gray-700 mb-1">Raio de Atendimento (km)</label>
              <input
                id="service_radius_km"
                v-model.number="form.service_radius_km"
                type="number"
                class="form-input w-full"
                min="1"
                max="500"
                placeholder="50"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Categories -->
      <div class="card mb-6">
        <div class="card-body">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Categorias de Servico</h2>
          <p class="text-gray-500 text-sm mb-4">Selecione as categorias em que o fornecedor atua.</p>

          <div v-if="categories.length === 0" class="text-sm text-gray-500 py-4">
            Nenhuma categoria disponivel.
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              @click="toggleCategory(category.id)"
              :class="[
                'p-3 border-2 rounded-lg text-left transition-all',
                form.category_ids?.includes(category.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                    form.category_ids?.includes(category.id)
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  ]"
                >
                  <svg
                    v-if="form.category_ids?.includes(category.id)"
                    class="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span
                  :class="[
                    'text-sm',
                    form.category_ids?.includes(category.id) ? 'text-primary-700 font-medium' : 'text-gray-700'
                  ]"
                >
                  {{ category.name }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          @click="cancel"
          class="btn btn-secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="submitting"
          class="btn btn-primary"
        >
          <svg
            v-if="submitting"
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ submitting ? 'Salvando...' : (isEditMode ? 'Salvar Alteracoes' : 'Criar Fornecedor') }}
        </button>
      </div>
    </form>
  </div>
</template>
