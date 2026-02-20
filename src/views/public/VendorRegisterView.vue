<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import publicVendorsService, { type VendorRegistrationData } from '@/services/publicVendors'
import type { Category } from '@/types'

const router = useRouter()
const toast = useToast()

// State
const categories = ref<Category[]>([])
const loading = ref(false)
const submitting = ref(false)
const currentStep = ref(1)
const totalSteps = 3

// Form data
const form = reactive<VendorRegistrationData>({
  trade_name: '',
  legal_name: '',
  cnpj: '',
  email: '',
  phone: '',
  whatsapp: '',
  website: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  service_radius_km: 50,
  description: '',
  accepts_urgent: false,
  is_local_business: false,
  is_sustainable: false,
  is_minority_owned: false,
  contact_name: '',
  contact_email: '',
  contact_phone: '',
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

// Computed
const selectedCategoriesNames = computed(() => {
  return categories.value
    .filter(c => form.category_ids.includes(c.id))
    .map(c => c.name)
    .join(', ')
})

// Methods
const loadCategories = async () => {
  loading.value = true
  try {
    categories.value = await publicVendorsService.getCategories()
  } catch (error) {
    toast.error('Erro ao carregar categorias')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const formatCnpj = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 14) {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return value
}

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }
  return value
}

const handleCnpjInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  form.cnpj = formatCnpj(input.value)
}

const handlePhoneInput = (field: 'phone' | 'whatsapp' | 'contact_phone', event: Event) => {
  const input = event.target as HTMLInputElement
  form[field] = formatPhone(input.value)
}

const validateStep = (step: number): boolean => {
  // Clear errors
  Object.keys(errors).forEach(key => delete errors[key])

  if (step === 1) {
    if (!form.trade_name.trim()) errors.trade_name = 'Nome fantasia e obrigatorio'
    if (!form.cnpj.trim()) errors.cnpj = 'CNPJ e obrigatorio'
    if (!form.email.trim()) errors.email = 'E-mail e obrigatorio'
    if (!form.city.trim()) errors.city = 'Cidade e obrigatoria'
    if (!form.state) errors.state = 'Estado e obrigatorio'
  }

  if (step === 2) {
    if (form.category_ids.length === 0) errors.category_ids = 'Selecione pelo menos uma categoria'
  }

  if (step === 3) {
    if (!form.contact_name.trim()) errors.contact_name = 'Nome do contato e obrigatorio'
    if (!form.contact_email.trim()) errors.contact_email = 'E-mail do contato e obrigatorio'
    if (!form.contact_phone.trim()) errors.contact_phone = 'Telefone do contato e obrigatorio'
  }

  return Object.keys(errors).length === 0
}

const nextStep = () => {
  if (validateStep(currentStep.value)) {
    currentStep.value++
  }
}

const prevStep = () => {
  currentStep.value--
}

const toggleCategory = (categoryId: string) => {
  const index = form.category_ids.indexOf(categoryId)
  if (index === -1) {
    form.category_ids.push(categoryId)
  } else {
    form.category_ids.splice(index, 1)
  }
}

const submit = async () => {
  if (!validateStep(currentStep.value)) return

  submitting.value = true
  try {
    await publicVendorsService.register(form)
    router.push({ name: 'vendor-register-success' })
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    if (err.response?.data?.errors) {
      Object.entries(err.response.data.errors).forEach(([key, messages]) => {
        errors[key] = messages[0] ?? ''
      })
    } else {
      toast.error(err.response?.data?.message || 'Erro ao realizar cadastro')
    }
    console.error(error)
  } finally {
    submitting.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadCategories()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-6">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-lg">O</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">Orchestra</h1>
            <p class="text-sm text-gray-500">Cadastro de Fornecedor</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Progress -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <template v-for="step in totalSteps" :key="step">
            <div class="flex items-center">
              <div
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                  currentStep >= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                ]"
              >
                {{ step }}
              </div>
              <span
                :class="[
                  'ml-2 text-sm font-medium',
                  currentStep >= step ? 'text-primary-600' : 'text-gray-500'
                ]"
              >
                {{ step === 1 ? 'Dados da Empresa' : step === 2 ? 'Categorias' : 'Contato' }}
              </span>
            </div>
            <div v-if="step < totalSteps" class="flex-1 mx-4 h-1 bg-gray-200 rounded">
              <div
                :class="['h-full bg-primary-600 rounded transition-all', currentStep > step ? 'w-full' : 'w-0']"
              ></div>
            </div>
          </template>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-500">Carregando...</p>
      </div>

      <!-- Form -->
      <div v-else class="bg-white rounded-lg shadow-sm p-6">
        <!-- Step 1: Company Data -->
        <div v-show="currentStep === 1">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Dados da Empresa</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nome Fantasia <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.trade_name"
                type="text"
                class="form-input w-full"
                :class="{ 'border-red-500': errors.trade_name }"
                placeholder="Nome da sua empresa"
              />
              <p v-if="errors.trade_name" class="text-red-500 text-sm mt-1">{{ errors.trade_name }}</p>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Razao Social</label>
              <input
                v-model="form.legal_name"
                type="text"
                class="form-input w-full"
                placeholder="Razao social (opcional)"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                CNPJ <span class="text-red-500">*</span>
              </label>
              <input
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

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                E-mail <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.email"
                type="email"
                class="form-input w-full"
                :class="{ 'border-red-500': errors.email }"
                placeholder="empresa@exemplo.com"
              />
              <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                :value="form.phone"
                @input="handlePhoneInput('phone', $event)"
                type="text"
                class="form-input w-full"
                placeholder="(00) 0000-0000"
                maxlength="15"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                :value="form.whatsapp"
                @input="handlePhoneInput('whatsapp', $event)"
                type="text"
                class="form-input w-full"
                placeholder="(00) 00000-0000"
                maxlength="15"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                v-model="form.website"
                type="url"
                class="form-input w-full"
                placeholder="https://www.suaempresa.com.br"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Endereco</label>
              <input
                v-model="form.address"
                type="text"
                class="form-input w-full"
                placeholder="Rua, numero, bairro"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Cidade <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.city"
                type="text"
                class="form-input w-full"
                :class="{ 'border-red-500': errors.city }"
                placeholder="Cidade"
              />
              <p v-if="errors.city" class="text-red-500 text-sm mt-1">{{ errors.city }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Estado <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.state"
                class="form-select w-full"
                :class="{ 'border-red-500': errors.state }"
              >
                <option value="">Selecione</option>
                <option v-for="uf in states" :key="uf" :value="uf">{{ uf }}</option>
              </select>
              <p v-if="errors.state" class="text-red-500 text-sm mt-1">{{ errors.state }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                v-model="form.zip_code"
                type="text"
                class="form-input w-full"
                placeholder="00000-000"
                maxlength="9"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Raio de Atendimento (km)</label>
              <input
                v-model.number="form.service_radius_km"
                type="number"
                class="form-input w-full"
                min="1"
                max="500"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Descricao da Empresa</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="form-input w-full"
                placeholder="Descreva sua empresa, servicos oferecidos, diferenciais..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Step 2: Categories -->
        <div v-show="currentStep === 2">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Categorias de Servico</h2>
          <p class="text-gray-500 text-sm mb-6">Selecione as categorias em que sua empresa atua.</p>

          <div v-if="errors.category_ids" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {{ errors.category_ids }}
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              @click="toggleCategory(category.id)"
              :class="[
                'p-4 border-2 rounded-lg text-left transition-all',
                form.category_ids.includes(category.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-5 h-5 rounded border-2 flex items-center justify-center',
                    form.category_ids.includes(category.id)
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  ]"
                >
                  <svg
                    v-if="form.category_ids.includes(category.id)"
                    class="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span :class="form.category_ids.includes(category.id) ? 'text-primary-700 font-medium' : 'text-gray-700'">
                  {{ category.name }}
                </span>
              </div>
            </button>
          </div>

          <div class="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 class="font-medium text-gray-700 mb-2">Caracteristicas (opcional)</h4>
            <div class="space-y-2">
              <label class="flex items-center gap-3 cursor-pointer">
                <input v-model="form.accepts_urgent" type="checkbox" class="form-checkbox" />
                <span class="text-gray-600">Aceito trabalhos urgentes</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input v-model="form.is_local_business" type="checkbox" class="form-checkbox" />
                <span class="text-gray-600">Negocio local / de bairro</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input v-model="form.is_sustainable" type="checkbox" class="form-checkbox" />
                <span class="text-gray-600">Praticas sustentaveis / ESG</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input v-model="form.is_minority_owned" type="checkbox" class="form-checkbox" />
                <span class="text-gray-600">Empresa de minoria / diversidade</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Step 3: Contact -->
        <div v-show="currentStep === 3">
          <h2 class="text-lg font-semibold text-gray-900 mb-2">Contato Principal</h2>
          <p class="text-gray-500 text-sm mb-6">Informe os dados da pessoa responsavel pelo cadastro.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.contact_name"
                type="text"
                class="form-input w-full"
                :class="{ 'border-red-500': errors.contact_name }"
                placeholder="Nome do responsavel"
              />
              <p v-if="errors.contact_name" class="text-red-500 text-sm mt-1">{{ errors.contact_name }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                E-mail <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.contact_email"
                type="email"
                class="form-input w-full"
                :class="{ 'border-red-500': errors.contact_email }"
                placeholder="contato@exemplo.com"
              />
              <p v-if="errors.contact_email" class="text-red-500 text-sm mt-1">{{ errors.contact_email }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Telefone <span class="text-red-500">*</span>
              </label>
              <input
                :value="form.contact_phone"
                @input="handlePhoneInput('contact_phone', $event)"
                type="text"
                class="form-input w-full"
                :class="{ 'border-red-500': errors.contact_phone }"
                placeholder="(00) 00000-0000"
                maxlength="15"
              />
              <p v-if="errors.contact_phone" class="text-red-500 text-sm mt-1">{{ errors.contact_phone }}</p>
            </div>
          </div>

          <!-- Summary -->
          <div class="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 class="font-medium text-gray-700 mb-4">Resumo do Cadastro</h4>
            <dl class="space-y-2 text-sm">
              <div class="flex">
                <dt class="w-32 text-gray-500">Empresa:</dt>
                <dd class="text-gray-900">{{ form.trade_name }}</dd>
              </div>
              <div class="flex">
                <dt class="w-32 text-gray-500">CNPJ:</dt>
                <dd class="text-gray-900">{{ form.cnpj }}</dd>
              </div>
              <div class="flex">
                <dt class="w-32 text-gray-500">Local:</dt>
                <dd class="text-gray-900">{{ form.city }}, {{ form.state }}</dd>
              </div>
              <div class="flex">
                <dt class="w-32 text-gray-500">Categorias:</dt>
                <dd class="text-gray-900">{{ selectedCategoriesNames || '-' }}</dd>
              </div>
            </dl>
          </div>

          <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-sm text-yellow-800">
              Ao enviar o cadastro, voce concorda que suas informacoes serao analisadas pela equipe Orchestra.
              Voce recebera um e-mail com o resultado da analise.
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-8 flex items-center justify-between">
          <button
            v-if="currentStep > 1"
            type="button"
            @click="prevStep"
            class="btn btn-secondary"
          >
            Voltar
          </button>
          <div v-else></div>

          <button
            v-if="currentStep < totalSteps"
            type="button"
            @click="nextStep"
            class="btn btn-primary"
          >
            Proximo
          </button>
          <button
            v-else
            type="button"
            @click="submit"
            :disabled="submitting"
            class="btn btn-primary"
          >
            <span v-if="submitting">Enviando...</span>
            <span v-else>Enviar Cadastro</span>
          </button>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
      <p>Orchestra - Plataforma de Gestao de Eventos e Fornecedores</p>
    </footer>
  </div>
</template>
