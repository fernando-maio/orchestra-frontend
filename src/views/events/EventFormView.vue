<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import eventsService, { type EventFormData } from '@/services/events'
import vendorsService from '@/services/vendors'
import type { Category } from '@/types'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Mode detection
const eventId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!eventId.value)
const pageTitle = computed(() => isEditMode.value ? 'Editar Evento' : 'Novo Evento')

// State
const loading = ref(false)
const submitting = ref(false)
const categories = ref<Category[]>([])

// Form data
const form = reactive<EventFormData & { required_categories: string[] }>({
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  venue_name: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  estimated_budget: undefined,
  expected_attendees: undefined,
  required_categories: [],
})

// Validation errors (from API)
const errors = ref<Record<string, string[]>>({})

// Brazilian states
const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

// Methods
const loadCategories = async () => {
  try {
    categories.value = await vendorsService.getCategories()
  } catch (error) {
    console.error('Erro ao carregar categorias:', error)
  }
}

const loadEvent = async () => {
  if (!eventId.value) return

  loading.value = true
  try {
    const event = await eventsService.get(eventId.value)
    form.name = event.name
    form.description = event.description || ''
    form.start_date = event.start_date
    form.end_date = event.end_date || ''
    form.venue_name = event.venue_name || ''
    form.address = event.address
    form.city = event.city
    form.state = event.state
    form.zip_code = event.zip_code || ''
    form.estimated_budget = event.estimated_budget ?? undefined
    form.expected_attendees = event.expected_attendees ?? undefined
    form.required_categories = event.required_categories || []
  } catch (error) {
    toast.error('Erro ao carregar evento')
    console.error(error)
    router.push({ name: 'events' })
  } finally {
    loading.value = false
  }
}

const formatZipCode = (value: string): string => {
  const numbers = value.replaceAll(/\D/g, '')
  if (numbers.length <= 8) {
    return numbers.replace(/(\d{5})(\d)/, '$1-$2')
  }
  return value
}

const handleZipCodeInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  form.zip_code = formatZipCode(input.value)
}

const toggleCategory = (categoryId: string) => {
  const index = form.required_categories.indexOf(categoryId)
  if (index === -1) {
    form.required_categories.push(categoryId)
  } else {
    form.required_categories.splice(index, 1)
  }
}

const getFieldError = (field: string): string | null => {
  return errors.value[field]?.[0] || null
}

const handleSubmit = async () => {
  submitting.value = true
  errors.value = {}

  // Build payload
  const payload: Record<string, unknown> = {
    name: form.name,
    description: form.description || undefined,
    start_date: form.start_date,
    end_date: form.end_date || undefined,
    venue_name: form.venue_name || undefined,
    address: form.address,
    city: form.city,
    state: form.state,
    zip_code: form.zip_code || undefined,
    estimated_budget: form.estimated_budget || undefined,
    expected_attendees: form.expected_attendees || undefined,
    required_categories: form.required_categories.length > 0 ? form.required_categories : undefined,
  }

  try {
    if (isEditMode.value) {
      await eventsService.update(eventId.value!, payload as Partial<EventFormData>)
      toast.success('Evento atualizado com sucesso')
    } else {
      await eventsService.create(payload as unknown as EventFormData)
      toast.success('Evento criado com sucesso')
    }
    router.push({ name: 'events' })
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    if (err.response?.data?.errors) {
      errors.value = err.response.data.errors
    } else {
      toast.error(err.response?.data?.message || 'Erro ao salvar evento')
    }
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const cancel = () => {
  router.push({ name: 'events' })
}

// Lifecycle
onMounted(async () => {
  await loadCategories()
  if (isEditMode.value) {
    await loadEvent()
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h1>
      <p class="text-gray-500">
        {{ isEditMode ? 'Altere as informações do evento' : 'Preencha as informações para criar um novo evento' }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit">
      <!-- Basic Info -->
      <div class="card mb-6">
        <div class="card-header">
          <h2 class="text-lg font-semibold text-gray-900">Informações Básicas</h2>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Name -->
            <div class="md:col-span-2">
              <label for="name" class="label">
                Nome do Evento <span class="text-red-500">*</span>
              </label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                :class="['input', getFieldError('name') ? 'input-error' : '']"
                placeholder="Ex: Conferencia de Tecnologia 2026"
              />
              <p v-if="getFieldError('name')" class="mt-1 text-sm text-red-600">{{ getFieldError('name') }}</p>
            </div>

            <!-- Description -->
            <div class="md:col-span-2">
              <label for="description" class="label">Descrição</label>
              <textarea
                id="description"
                v-model="form.description"
                rows="3"
                :class="['input', getFieldError('description') ? 'input-error' : '']"
                placeholder="Descreva o evento, seu objetivo e detalhes relevantes..."
              ></textarea>
              <p v-if="getFieldError('description')" class="mt-1 text-sm text-red-600">{{ getFieldError('description') }}</p>
            </div>

            <!-- Start Date -->
            <div>
              <label for="start_date" class="label">
                Data de Início <span class="text-red-500">*</span>
              </label>
              <input
                id="start_date"
                v-model="form.start_date"
                type="date"
                required
                :class="['input', getFieldError('start_date') ? 'input-error' : '']"
              />
              <p v-if="getFieldError('start_date')" class="mt-1 text-sm text-red-600">{{ getFieldError('start_date') }}</p>
            </div>

            <!-- End Date -->
            <div>
              <label for="end_date" class="label">Data de Término</label>
              <input
                id="end_date"
                v-model="form.end_date"
                type="date"
                :min="form.start_date"
                :class="['input', getFieldError('end_date') ? 'input-error' : '']"
              />
              <p v-if="getFieldError('end_date')" class="mt-1 text-sm text-red-600">{{ getFieldError('end_date') }}</p>
            </div>

            <!-- Estimated Budget -->
            <div>
              <label for="estimated_budget" class="label">Orçamento Estimado (R$)</label>
              <input
                id="estimated_budget"
                v-model.number="form.estimated_budget"
                type="number"
                min="0"
                step="0.01"
                :class="['input', getFieldError('estimated_budget') ? 'input-error' : '']"
                placeholder="0,00"
              />
              <p v-if="getFieldError('estimated_budget')" class="mt-1 text-sm text-red-600">{{ getFieldError('estimated_budget') }}</p>
            </div>

            <!-- Expected Attendees -->
            <div>
              <label for="expected_attendees" class="label">Participantes Esperados</label>
              <input
                id="expected_attendees"
                v-model.number="form.expected_attendees"
                type="number"
                min="0"
                :class="['input', getFieldError('expected_attendees') ? 'input-error' : '']"
                placeholder="Ex: 200"
              />
              <p v-if="getFieldError('expected_attendees')" class="mt-1 text-sm text-red-600">{{ getFieldError('expected_attendees') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Location -->
      <div class="card mb-6">
        <div class="card-header">
          <h2 class="text-lg font-semibold text-gray-900">Local do Evento</h2>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Venue Name -->
            <div class="md:col-span-2">
              <label for="venue_name" class="label">Nome do Local</label>
              <input
                id="venue_name"
                v-model="form.venue_name"
                type="text"
                :class="['input', getFieldError('venue_name') ? 'input-error' : '']"
                placeholder="Ex: Centro de Convenções"
              />
              <p v-if="getFieldError('venue_name')" class="mt-1 text-sm text-red-600">{{ getFieldError('venue_name') }}</p>
            </div>

            <!-- Address -->
            <div class="md:col-span-2">
              <label for="address" class="label">
                Endereço <span class="text-red-500">*</span>
              </label>
              <input
                id="address"
                v-model="form.address"
                type="text"
                required
                :class="['input', getFieldError('address') ? 'input-error' : '']"
                placeholder="Rua, numero, bairro"
              />
              <p v-if="getFieldError('address')" class="mt-1 text-sm text-red-600">{{ getFieldError('address') }}</p>
            </div>

            <!-- City -->
            <div>
              <label for="city" class="label">
                Cidade <span class="text-red-500">*</span>
              </label>
              <input
                id="city"
                v-model="form.city"
                type="text"
                required
                :class="['input', getFieldError('city') ? 'input-error' : '']"
                placeholder="Cidade"
              />
              <p v-if="getFieldError('city')" class="mt-1 text-sm text-red-600">{{ getFieldError('city') }}</p>
            </div>

            <!-- State -->
            <div>
              <label for="state" class="label">
                Estado <span class="text-red-500">*</span>
              </label>
              <select
                id="state"
                v-model="form.state"
                required
                :class="['input', getFieldError('state') ? 'input-error' : '']"
              >
                <option value="">Selecione o estado</option>
                <option v-for="uf in states" :key="uf" :value="uf">{{ uf }}</option>
              </select>
              <p v-if="getFieldError('state')" class="mt-1 text-sm text-red-600">{{ getFieldError('state') }}</p>
            </div>

            <!-- Zip Code -->
            <div>
              <label for="zip_code" class="label">CEP</label>
              <input
                id="zip_code"
                :value="form.zip_code"
                @input="handleZipCodeInput"
                type="text"
                :class="['input', getFieldError('zip_code') ? 'input-error' : '']"
                placeholder="00000-000"
                maxlength="9"
              />
              <p v-if="getFieldError('zip_code')" class="mt-1 text-sm text-red-600">{{ getFieldError('zip_code') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories -->
      <div v-if="categories.length > 0" class="card mb-6">
        <div class="card-header">
          <h2 class="text-lg font-semibold text-gray-900">Categorias Necessarias</h2>
          <p class="text-sm text-gray-500 mt-1">Selecione as categorias de serviço que o evento vai precisar.</p>
        </div>
        <div class="card-body">
          <p v-if="getFieldError('required_categories')" class="mb-4 text-sm text-red-600">{{ getFieldError('required_categories') }}</p>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              @click="toggleCategory(category.id)"
              :class="[
                'p-3 border-2 rounded-lg text-left transition-all text-sm',
                form.required_categories.includes(category.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                    form.required_categories.includes(category.id)
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  ]"
                >
                  <svg
                    v-if="form.required_categories.includes(category.id)"
                    class="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span :class="form.required_categories.includes(category.id) ? 'text-primary-700 font-medium' : 'text-gray-700'">
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
          :disabled="submitting"
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
          {{ submitting ? 'Salvando...' : (isEditMode ? 'Salvar Alteracoes' : 'Criar Evento') }}
        </button>
      </div>
    </form>
  </div>
</template>
