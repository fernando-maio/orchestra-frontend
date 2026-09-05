<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToHome = () => {
  router.push({ name: 'login' })
}

const registerAnother = () => {
  router.push({ name: 'vendor-register' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
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
    <main class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full text-center">
        <!-- Success Icon -->
        <div class="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg class="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <!-- Title -->
        <h1 class="text-2xl font-bold text-gray-900 mb-4">
          Cadastro Enviado com Sucesso!
        </h1>

        <!-- Description -->
        <p class="text-gray-600 mb-8">
          Seu cadastro foi recebido e esta em analise pela nossa equipe.
          Você recebera um e-mail em breve com o resultado.
        </p>

        <!-- Steps -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-8 text-left">
          <h3 class="font-semibold text-gray-900 mb-4">Proximos passos:</h3>
          <ol class="space-y-3">
            <li class="flex items-start gap-3">
              <span class="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <span class="text-gray-600">Nossa equipe analisara seus dados cadastrais</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <span class="text-gray-600">Você recebera um e-mail com o resultado da analise</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
              <span class="text-gray-600">Após aprovacao, sua empresa estara visivel para clientes</span>
            </li>
          </ol>
        </div>

        <!-- Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p class="text-sm text-blue-800">
            O prazo medio de analise e de 1 a 2 dias uteis. Em caso de duvidas,
            entre em contato pelo e-mail <strong>suporte@orchestra.com.br</strong>
          </p>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button @click="registerAnother" class="btn btn-secondary">
            Cadastrar Outra Empresa
          </button>
          <button @click="goToHome" class="btn btn-primary">
            Ir para Login
          </button>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-8 text-center text-sm text-gray-500">
      <p>Orchestra - Plataforma de Gestao de Eventos e Fornecedores</p>
    </footer>
  </div>
</template>
