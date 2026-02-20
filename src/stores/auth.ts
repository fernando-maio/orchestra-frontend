import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import type { User, LoginCredentials, RegisterData, AuthResponse, ApiResponse } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isSuperAdmin = computed(() => user.value?.roles.includes('super-admin') ?? false)
  const isAdmin = computed(() => user.value?.roles.includes('admin') ?? false)
  const organization = computed(() => user.value?.organization ?? null)

  const hasRole = (role: string) => user.value?.roles.includes(role) ?? false
  const hasPermission = (permission: string) => user.value?.permissions.includes(permission) ?? false
  const hasAnyPermission = (permissions: string[]) => permissions.some(p => hasPermission(p))

  // Actions
  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true
    try {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/login', credentials)
      setAuth(data.data)
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterData): Promise<void> {
    loading.value = true
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/register', data)
      setAuth(response.data.data)
    } finally {
      loading.value = false
    }
  }

  async function fetchUser(): Promise<void> {
    if (!token.value) return

    loading.value = true
    try {
      const { data } = await api.get<ApiResponse<User>>('/me')
      user.value = data.data
      localStorage.setItem('user', JSON.stringify(data.data))
    } catch {
      logout()
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      if (token.value) {
        await api.post('/logout')
      }
    } catch {
      // Ignore errors on logout
    } finally {
      clearAuth()
    }
  }

  async function logoutAll(): Promise<void> {
    try {
      await api.post('/logout-all')
    } finally {
      clearAuth()
    }
  }

  function setAuth(authData: AuthResponse): void {
    user.value = authData.user
    token.value = authData.token
    localStorage.setItem('token', authData.token)
    localStorage.setItem('user', JSON.stringify(authData.user))
  }

  function clearAuth(): void {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function restoreSession(): void {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        clearAuth()
      }
    }
  }

  return {
    // State
    user,
    token,
    loading,

    // Getters
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    organization,
    hasRole,
    hasPermission,
    hasAnyPermission,

    // Actions
    login,
    register,
    fetchUser,
    logout,
    logoutAll,
    restoreSession,
  }
})
