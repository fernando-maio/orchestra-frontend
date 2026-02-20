import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import { setupTestPinia, mockUser, mockSuperAdmin } from '@/test/helpers'

// Mock the api module
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

import api from '@/services/api'

describe('Auth Store', () => {
  beforeEach(() => {
    setupTestPinia()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have null user and token', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('should not be authenticated', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('should set user and token on successful login', async () => {
      const authResponse = { user: mockUser, token: 'test-token-123' }
      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: authResponse } })

      const store = useAuthStore()
      await store.login({ email: 'test@test.com', password: 'password' })

      expect(store.user).toEqual(mockUser)
      expect(store.token).toBe('test-token-123')
      expect(store.isAuthenticated).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token-123')
    })

    it('should set loading during login', async () => {
      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => { resolvePromise = resolve })
      vi.mocked(api.post).mockReturnValueOnce(promise as ReturnType<typeof api.post>)

      const store = useAuthStore()
      const loginPromise = store.login({ email: 'test@test.com', password: 'password' })

      expect(store.loading).toBe(true)

      resolvePromise!({ data: { data: { user: mockUser, token: 'tok' } } })
      await loginPromise

      expect(store.loading).toBe(false)
    })

    it('should reset loading on login failure', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Invalid credentials'))

      const store = useAuthStore()
      await expect(store.login({ email: 'bad', password: 'bad' })).rejects.toThrow()
      expect(store.loading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should clear auth state', async () => {
      const store = useAuthStore()
      // Set auth first
      store.user = mockUser as never
      store.token = 'test-token'
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} })

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user')
    })

    it('should clear auth even if API call fails', async () => {
      const store = useAuthStore()
      store.user = mockUser as never
      store.token = 'test-token'
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'))

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
    })
  })

  describe('restoreSession', () => {
    it('should restore from localStorage', () => {
      localStorage.setItem('token', 'stored-token')
      localStorage.setItem('user', JSON.stringify(mockUser))

      const store = useAuthStore()
      store.restoreSession()

      expect(store.token).toBe('stored-token')
      expect(store.user).toEqual(mockUser)
      expect(store.isAuthenticated).toBe(true)
    })

    it('should clear auth on invalid JSON in localStorage', () => {
      localStorage.setItem('token', 'stored-token')
      localStorage.setItem('user', 'invalid-json')

      const store = useAuthStore()
      store.restoreSession()

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
    })

    it('should not restore if no stored data', () => {
      const store = useAuthStore()
      store.restoreSession()

      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('computed roles', () => {
    it('should detect super admin', () => {
      const store = useAuthStore()
      store.user = mockSuperAdmin as never

      expect(store.isSuperAdmin).toBe(true)
      expect(store.isAdmin).toBe(false)
    })

    it('should detect admin', () => {
      const store = useAuthStore()
      store.user = mockUser as never

      expect(store.isSuperAdmin).toBe(false)
      expect(store.isAdmin).toBe(true)
    })

    it('should check roles correctly', () => {
      const store = useAuthStore()
      store.user = mockUser as never

      expect(store.hasRole('admin')).toBe(true)
      expect(store.hasRole('super-admin')).toBe(false)
    })

    it('should check permissions', () => {
      const store = useAuthStore()
      store.user = mockUser as never

      expect(store.hasPermission('events.view')).toBe(true)
      expect(store.hasPermission('organizations.delete')).toBe(false)
    })

    it('should check any permission', () => {
      const store = useAuthStore()
      store.user = mockUser as never

      expect(store.hasAnyPermission(['events.view', 'organizations.delete'])).toBe(true)
      expect(store.hasAnyPermission(['organizations.delete', 'organizations.create'])).toBe(false)
    })
  })

  describe('fetchUser', () => {
    it('should update user from API', async () => {
      const store = useAuthStore()
      store.token = 'test-token'

      const updatedUser = { ...mockUser, name: 'Updated Name' }
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: updatedUser } })

      await store.fetchUser()

      expect(store.user).toEqual(updatedUser)
    })

    it('should logout on fetch failure', async () => {
      const store = useAuthStore()
      store.token = 'test-token'
      store.user = mockUser as never

      vi.mocked(api.get).mockRejectedValueOnce(new Error('401'))
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} }) // logout call

      await store.fetchUser()

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
    })

    it('should skip fetch if no token', async () => {
      const store = useAuthStore()
      await store.fetchUser()

      expect(api.get).not.toHaveBeenCalled()
    })
  })
})
