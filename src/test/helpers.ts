import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'
import { mount } from '@vue/test-utils'

export function setupTestPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

export function createTestRouter(routes?: Array<{ path: string; component: Component; name?: string }>) {
  const defaultRoutes = [
    { path: '/', component: { template: '<div>Home</div>' }, name: 'home' },
    { path: '/login', component: { template: '<div>Login</div>' }, name: 'login' },
    { path: '/dashboard', component: { template: '<div>Dashboard</div>' }, name: 'dashboard' },
  ]

  return createRouter({
    history: createWebHistory(),
    routes: routes ?? defaultRoutes,
  })
}

export function mountWithPlugins(component: Component, options: Record<string, unknown> = {}) {
  const pinia = setupTestPinia()
  const router = createTestRouter()

  return mount(component, {
    global: {
      plugins: [pinia, router],
      stubs: {
        teleport: true,
        RouterLink: { template: '<a><slot /></a>' },
        RouterView: { template: '<div />' },
      },
      ...((options.global as Record<string, unknown>) ?? {}),
    },
    ...options,
  })
}

/**
 * Monta uma store de auth ja autenticada, com as permissoes informadas.
 *
 * Serve para testar componentes que escondem acoes por permissao: o teste
 * declara exatamente o que o perfil pode, sem depender de chamada de API.
 */
export function setupAuthWithPermissions(
  permissions: string[],
  overrides: Partial<{ roles: string[]; name: string; email: string }> = {},
) {
  const pinia = setupTestPinia()
  const store = useAuthStore()

  store.user = {
    ...mockUser,
    ...overrides,
    roles: overrides.roles ?? ['admin'],
    permissions,
  } as never
  store.token = 'token-de-teste'

  return { pinia, store }
}

export const mockUser = {
  id: 'test-user-uuid',
  name: 'Test User',
  email: 'test@orchestra.local',
  organization_id: 'test-org-uuid',
  is_active: true,
  organization: {
    id: 'test-org-uuid',
    name: 'Test Organization',
    subscription_status: 'active',
    subscription_plan: 'starter',
  },
  roles: ['admin'],
  permissions: ['events.view', 'events.create', 'events.update', 'events.delete', 'vendors.view', 'vendors.create'],
}

export const mockSuperAdmin = {
  ...mockUser,
  id: 'super-admin-uuid',
  name: 'Super Admin',
  email: 'admin@orchestra.local',
  organization_id: null,
  organization: null,
  roles: ['super-admin'],
  permissions: [],
}
