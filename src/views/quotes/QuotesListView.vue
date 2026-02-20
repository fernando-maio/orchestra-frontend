<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Cotacoes</h1>
        <p class="mt-1 text-sm text-gray-500">Gerencie solicitacoes de cotacao para seus eventos</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <div class="mx-auto w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
        <svg class="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Modulo de Cotacoes</h2>
      <p class="text-gray-500 max-w-md mx-auto mb-6">
        O sistema de cotacoes permitira criar solicitacoes, convidar fornecedores e comparar propostas
        de forma centralizada.
      </p>
      <div class="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto text-left">
        <p class="text-sm font-medium text-gray-700 mb-2">Funcionalidades previstas:</p>
        <ul class="text-sm text-gray-500 space-y-1">
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
            Criar solicitacoes de cotacao por evento
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
            Convidar fornecedores por categoria
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
            Acompanhar status de respostas
          </li>
          <li class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-primary-400 rounded-full"></span>
            Comparar propostas lado a lado
          </li>
        </ul>
      </div>
      <p class="mt-6 text-xs text-gray-400">Disponivel na Fase 2 do roadmap</p>
    </div>
  </div>
</template>
