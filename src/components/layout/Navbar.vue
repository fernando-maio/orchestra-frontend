<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

defineEmits<{
  'toggle-sidebar': []
  logout: []
}>()

const authStore = useAuthStore()
const userMenuOpen = ref(false)
</script>

<template>
  <nav class="sticky top-0 z-40 bg-white border-b border-gray-200">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <!-- Mobile menu button -->
        <button
          type="button"
          class="lg:hidden -ml-2 p-2 text-gray-400 hover:text-gray-500"
          @click="$emit('toggle-sidebar')"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Search (optional) -->
        <div class="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-start">
          <div class="max-w-lg w-full lg:max-w-xs">
            <label for="search" class="sr-only">Buscar</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                disabled
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 bg-gray-50 cursor-not-allowed"
                placeholder="Busca em breve..."
                type="search"
              />
            </div>
          </div>
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-4">
          <!-- Notifications -->
          <button
            type="button"
            class="p-2 text-gray-400 hover:text-gray-500 relative"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <!-- notification badge hidden until notifications are implemented -->
          </button>

          <!-- User menu -->
          <div class="relative">
            <button
              type="button"
              class="flex items-center gap-2 text-sm"
              @click="userMenuOpen = !userMenuOpen"
            >
              <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span class="text-primary-700 font-medium">
                  {{ authStore.user?.name?.charAt(0).toUpperCase() }}
                </span>
              </div>
              <span class="hidden md:block text-gray-700">{{ authStore.user?.name }}</span>
              <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown menu -->
            <div
              v-if="userMenuOpen"
              class="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
              @click="userMenuOpen = false"
            >
              <div class="px-4 py-2 border-b border-gray-100">
                <p class="text-sm font-medium text-gray-900">{{ authStore.user?.name }}</p>
                <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email }}</p>
              </div>
              <router-link
                to="/settings"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Configurações
              </router-link>
              <button
                type="button"
                class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                @click="$emit('logout')"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
