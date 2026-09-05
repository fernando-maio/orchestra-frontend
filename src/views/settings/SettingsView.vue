<script setup lang="ts">
import { getValidationErrors } from '@/types/api-error'
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuthStore()

const saving = ref(false)
const success = ref(false)
const errors = ref<Record<string, string[]>>({})

const profileForm = reactive({
  name: '',
  email: '',
})

const passwordForm = reactive({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const passwordSaving = ref(false)
const passwordSuccess = ref(false)
const passwordErrors = ref<Record<string, string[]>>({})

onMounted(() => {
  if (authStore.user) {
    profileForm.name = authStore.user.name
    profileForm.email = authStore.user.email
  }
})

const saveProfile = async () => {
  saving.value = true
  errors.value = {}
  success.value = false

  try {
    await api.put('/auth/profile', profileForm)
    await authStore.fetchUser()
    success.value = true
    setTimeout(() => { success.value = false }, 3000)
  } catch (error: unknown) {
    const validacao = getValidationErrors(error)
    if (validacao) {
      errors.value = validacao
    }
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  passwordSaving.value = true
  passwordErrors.value = {}
  passwordSuccess.value = false

  try {
    await api.put('/auth/password', passwordForm)
    passwordSuccess.value = true
    passwordForm.current_password = ''
    passwordForm.password = ''
    passwordForm.password_confirmation = ''
    setTimeout(() => { passwordSuccess.value = false }, 3000)
  } catch (error: unknown) {
    const validacao = getValidationErrors(error)
    if (validacao) {
      passwordErrors.value = validacao
    }
  } finally {
    passwordSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Configurações</h1>
      <p class="mt-1 text-sm text-gray-500">Gerencie seu perfil e preferências</p>
    </div>

    <!-- Profile Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Perfil</h2>
        <p class="text-sm text-gray-500">Atualize suas informações pessoais</p>
      </div>
      <form class="p-6 space-y-4" @submit.prevent="saveProfile">
        <div v-if="success" class="p-3 bg-green-50 text-green-700 text-sm rounded-lg">
          Perfil atualizado com sucesso!
        </div>

        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            id="name"
            v-model="profileForm.name"
            type="text"
            required
            class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name[0] }}</p>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input
            id="email"
            :value="profileForm.email"
            type="email"
            readonly
            disabled
            class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          <p class="mt-1 text-xs text-gray-500">
            O e-mail é usado para login e não pode ser alterado por aqui.
          </p>
          <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email[0] }}</p>
        </div>

        <div v-if="authStore.user?.organization" class="p-3 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500">
            <span class="font-medium text-gray-700">Organização:</span>
            {{ authStore.user.organization.name }}
          </p>
          <p class="text-sm text-gray-500 mt-1">
            <span class="font-medium text-gray-700">Plano:</span>
            {{ authStore.user.organization.subscription_plan }}
          </p>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="saving"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {{ saving ? 'Salvando...' : 'Salvar Perfil' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Password Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Alterar Senha</h2>
        <p class="text-sm text-gray-500">Atualize sua senha de acesso</p>
      </div>
      <form class="p-6 space-y-4" @submit.prevent="changePassword">
        <div v-if="passwordSuccess" class="p-3 bg-green-50 text-green-700 text-sm rounded-lg">
          Senha alterada com sucesso!
        </div>

        <div>
          <label for="current_password" class="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
          <input
            id="current_password"
            v-model="passwordForm.current_password"
            type="password"
            required
            class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p v-if="passwordErrors.current_password" class="mt-1 text-sm text-red-600">{{ passwordErrors.current_password[0] }}</p>
        </div>

        <div>
          <label for="new_password" class="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
          <input
            id="new_password"
            v-model="passwordForm.password"
            type="password"
            required
            minlength="8"
            class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p v-if="passwordErrors.password" class="mt-1 text-sm text-red-600">{{ passwordErrors.password[0] }}</p>
        </div>

        <div>
          <label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
          <input
            id="password_confirmation"
            v-model="passwordForm.password_confirmation"
            type="password"
            required
            minlength="8"
            class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="passwordSaving"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {{ passwordSaving ? 'Salvando...' : 'Alterar Senha' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
