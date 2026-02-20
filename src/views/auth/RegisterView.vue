<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import type { RegisterData } from '@/types'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const loading = ref(false)
const form = reactive<RegisterData>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  organization_name: '',
})
const errors = ref<Record<string, string[]>>({})

const handleSubmit = async () => {
  loading.value = true
  errors.value = {}

  try {
    await authStore.register(form)
    toast.success('Conta criada com sucesso!')
    router.push('/')
  } catch (error: any) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message)
    } else {
      toast.error('Erro ao criar conta. Tente novamente.')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h1 class="text-center text-3xl font-bold text-primary-600">Orchestra</h1>
      <h2 class="mt-6 text-center text-2xl font-semibold text-gray-900">
        Crie sua conta
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Já tem uma conta?
        <router-link to="/login" class="font-medium text-primary-600 hover:text-primary-500">
          Faça login
        </router-link>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow-sm rounded-xl sm:px-10 border border-gray-200">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Organization name -->
          <div>
            <label for="organization_name" class="label">Nome da Empresa</label>
            <input
              id="organization_name"
              v-model="form.organization_name"
              type="text"
              required
              :class="['input', errors.organization_name ? 'input-error' : '']"
              placeholder="Sua Empresa Ltda"
            />
            <p v-if="errors.organization_name" class="mt-1 text-sm text-red-600">{{ errors.organization_name[0] }}</p>
          </div>

          <!-- Name -->
          <div>
            <label for="name" class="label">Seu Nome</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              :class="['input', errors.name ? 'input-error' : '']"
              placeholder="João Silva"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name[0] }}</p>
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="label">E-mail</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              :class="['input', errors.email ? 'input-error' : '']"
              placeholder="seu@email.com"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email[0] }}</p>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="label">Senha</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              :class="['input', errors.password ? 'input-error' : '']"
              placeholder="••••••••"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password[0] }}</p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="password_confirmation" class="label">Confirmar Senha</label>
            <input
              id="password_confirmation"
              v-model="form.password_confirmation"
              type="password"
              required
              class="input"
              placeholder="••••••••"
            />
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full py-3"
          >
            <svg
              v-if="loading"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Criando conta...' : 'Criar conta' }}
          </button>
        </form>

        <!-- Trial info -->
        <p class="mt-6 text-xs text-gray-500 text-center">
          Ao criar uma conta, você terá 14 dias de teste gratuito.
        </p>
      </div>
    </div>
  </div>
</template>
