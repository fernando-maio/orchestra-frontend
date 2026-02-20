<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <router-link to="/quotes" class="text-gray-400 hover:text-gray-600">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">Detalhes da Cotacao</h1>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <div class="mx-auto w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Detalhes da Cotacao</h2>
      <p class="text-gray-500 max-w-md mx-auto">
        A visualizacao detalhada de cotacoes, com propostas recebidas e comparativos,
        estara disponivel na Fase 2.
      </p>
      <p class="mt-6 text-xs text-gray-400">Disponivel na Fase 2 do roadmap</p>
    </div>
  </div>
</template>
