<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  open: boolean
}>()

defineEmits<{
  close: []
}>()

const route = useRoute()
const authStore = useAuthStore()

// Admin navigation for super admins
const adminNavigation = computed(() => [
  {
    name: 'Dashboard Admin',
    href: '/admin',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    current: route.path === '/admin',
  },
  {
    name: 'Organizações',
    href: '/organizations',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    current: route.path.startsWith('/organizations'),
  },
  {
    name: 'Todos Eventos',
    href: '/events',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    current: route.path.startsWith('/events'),
  },
  {
    name: 'Todos Fornecedores',
    href: '/vendors',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    current: route.path.startsWith('/vendors'),
  },
  {
    name: 'Categorias',
    href: '/categories',
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    current: route.path.startsWith('/categories'),
  },
])

// Client navigation
const clientNavigation = computed(() => [
  {
    name: 'Dashboard',
    href: '/',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    current: route.path === '/',
  },
  {
    name: 'Eventos',
    href: '/events',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    current: route.path.startsWith('/events'),
  },
  {
    name: 'Fornecedores',
    href: '/vendors',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    current: route.path.startsWith('/vendors'),
  },
  {
    name: 'Orçamentos',
    href: '/quotes',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    current: route.path.startsWith('/quotes'),
  },
  {
    name: 'Propostas',
    href: '/proposals',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    current: route.path.startsWith('/proposals'),
  },
])

// Dynamic navigation based on role
const navigation = computed(() => {
  return authStore.isSuperAdmin ? adminNavigation.value : clientNavigation.value
})
</script>

<template>
  <!-- Mobile sidebar -->
  <div
    :class="[
      open ? 'translate-x-0' : '-translate-x-full',
      'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden'
    ]"
  >
    <div class="flex h-16 items-center justify-between px-6 border-b border-gray-200">
      <span class="text-xl font-bold text-primary-600">Orchestra</span>
      <button
        type="button"
        class="text-gray-400 hover:text-gray-500"
        @click="$emit('close')"
      >
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <nav class="mt-6 px-3">
      <router-link
        v-for="item in navigation"
        :key="item.name"
        :to="item.href"
        :class="[
          item.current ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50',
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
        ]"
        @click="$emit('close')"
      >
        <svg
          :class="[item.current ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500']"
          class="h-5 w-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
        </svg>
        {{ item.name }}
      </router-link>
    </nav>
  </div>

  <!-- Desktop sidebar -->
  <div class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
    <div class="flex flex-col flex-grow bg-white border-r border-gray-200">
      <!-- Logo -->
      <div class="flex h-16 items-center px-6 border-b border-gray-200">
        <span class="text-xl font-bold text-primary-600">Orchestra</span>
      </div>

      <!-- Organization info -->
      <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <template v-if="authStore.isSuperAdmin">
          <p class="text-xs text-gray-500">Painel</p>
          <p class="text-sm font-medium text-indigo-600 truncate">Super Admin</p>
        </template>
        <template v-else-if="authStore.organization">
          <p class="text-xs text-gray-500">Organização</p>
          <p class="text-sm font-medium text-gray-900 truncate">{{ authStore.organization.name }}</p>
        </template>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 mt-4 px-3 space-y-1">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            item.current ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50',
            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
          ]"
        >
          <svg
            :class="[item.current ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500']"
            class="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          {{ item.name }}
        </router-link>
      </nav>

      <!-- Settings link -->
      <div class="px-3 py-4 border-t border-gray-200">
        <router-link
          to="/settings"
          :class="[
            route.path === '/settings' ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50',
            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
          ]"
        >
          <svg class="h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configurações
        </router-link>
      </div>
    </div>
  </div>
</template>
