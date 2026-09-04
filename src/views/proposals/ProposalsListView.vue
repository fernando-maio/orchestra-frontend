<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Propostas</h1>
        <p class="mt-1 text-sm text-gray-500">Avalie e gerencie propostas recebidas de fornecedores</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <div class="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Modulo de Propostas</h2>
      <p class="text-gray-500 max-w-md mx-auto mb-6">
        O sistema de propostas permitira receber, avaliar, aprovar e contratar propostas
        de fornecedores para seus eventos.
      </p>
      <div class="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto text-left">
        <p class="text-sm font-medium text-gray-700 mb-2">Funcionalidades previstas:</p>
        <ul class="text-sm text-gray-500 space-y-1">
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            Receber propostas de fornecedores
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            Comparar valores e condicoes
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            Aprovar, rejeitar e contratar
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            Histórico de negociacao
          </li>
        </ul>
      </div>
      <p class="mt-6 text-xs text-gray-400">Disponível na Fase 2 do roadmap</p>
    </div>
  </div>
</template>
