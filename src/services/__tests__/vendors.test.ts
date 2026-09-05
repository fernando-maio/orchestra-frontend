import { describe, it, expect, vi, beforeEach } from 'vitest'
import vendorsService from '@/services/vendors'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

import api from '@/services/api'

const mockVendor = {
  id: 'vendor-uuid-1',
  trade_name: 'Test Vendor',
  cnpj: '12.345.678/0001-90',
  email: 'vendor@test.com',
  city: 'São Paulo',
  state: 'SP',
  is_active: true,
  is_verified: false,
  approval_status: 'approved',
}

describe('Vendors Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should fetch vendors with filters', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          data: [mockVendor],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        },
      })

      const result = await vendorsService.list({ state: 'SP', is_active: true })

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/vendors?'))
      expect(result.data).toHaveLength(1)
    })
  })

  describe('get', () => {
    it('should fetch single vendor', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockVendor } })

      const result = await vendorsService.get('vendor-uuid-1')
      expect(result.trade_name).toBe('Test Vendor')
    })
  })

  describe('create', () => {
    it('should create vendor', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: mockVendor } })

      const result = await vendorsService.create({ trade_name: 'Test Vendor' })
      expect(api.post).toHaveBeenCalledWith('/vendors', { trade_name: 'Test Vendor' })
      expect(result.id).toBe('vendor-uuid-1')
    })
  })

  describe('update', () => {
    it('should update vendor', async () => {
      const updated = { ...mockVendor, trade_name: 'Updated' }
      vi.mocked(api.put).mockResolvedValueOnce({ data: { data: updated } })

      const result = await vendorsService.update('vendor-uuid-1', { trade_name: 'Updated' })
      expect(result.trade_name).toBe('Updated')
    })
  })

  describe('delete', () => {
    it('should delete vendor', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: {} })
      await vendorsService.delete('vendor-uuid-1')
      expect(api.delete).toHaveBeenCalledWith('/vendors/vendor-uuid-1')
    })
  })

  describe('toggleActive', () => {
    it('should toggle vendor active status', async () => {
      const toggled = { ...mockVendor, is_active: false }
      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: toggled } })

      const result = await vendorsService.toggleActive('vendor-uuid-1')
      expect(api.post).toHaveBeenCalledWith('/vendors/vendor-uuid-1/toggle-active')
      expect(result.is_active).toBe(false)
    })
  })

  describe('verify', () => {
    it('should verify vendor', async () => {
      const verified = { ...mockVendor, is_verified: true }
      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: verified } })

      const result = await vendorsService.verify('vendor-uuid-1')
      expect(result.is_verified).toBe(true)
    })
  })

  describe('approve', () => {
    it('should approve vendor', async () => {
      const approved = { ...mockVendor, approval_status: 'approved' }
      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: approved } })

      const result = await vendorsService.approve('vendor-uuid-1')
      expect(result.approval_status).toBe('approved')
    })
  })

  describe('reject', () => {
    it('should reject vendor with reason', async () => {
      const rejected = { ...mockVendor, approval_status: 'rejected' }
      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: rejected } })

      const result = await vendorsService.reject('vendor-uuid-1', 'Documentação incompleta')
      expect(api.post).toHaveBeenCalledWith('/vendors/vendor-uuid-1/reject', { reason: 'Documentação incompleta' })
      expect(result.approval_status).toBe('rejected')
    })
  })

  describe('getCompliance', () => {
    it('should fetch compliance data', async () => {
      const compliance = { has_cnpj: true, has_alvara: false }
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: compliance } })

      const result = await vendorsService.getCompliance('vendor-uuid-1')
      expect(result).toEqual(compliance)
    })
  })

  describe('getCategories', () => {
    it('should fetch categories', async () => {
      const categories = [{ id: 'cat-1', name: 'Buffet' }]
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: categories } })

      const result = await vendorsService.getCategories()
      expect(result).toHaveLength(1)
      expect(result[0]!.name).toBe('Buffet')
    })
  })

  describe('updateSubscriptionTier', () => {
    it('envia o plano para o endpoint dedicado', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { data: { ...mockVendor, subscription_tier: 'premium' } },
      })

      const resultado = await vendorsService.updateSubscriptionTier('v-1', 'premium')

      expect(api.post).toHaveBeenCalledWith('/vendors/v-1/subscription-tier', {
        subscription_tier: 'premium',
      })
      expect(resultado.subscription_tier).toBe('premium')
    })

    it.each(['free', 'featured', 'premium'] as const)('aceita o plano %s', async (tier) => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { data: { ...mockVendor, subscription_tier: tier } },
      })

      const resultado = await vendorsService.updateSubscriptionTier('v-1', tier)

      expect(resultado.subscription_tier).toBe(tier)
    })

    it('propaga o erro quando o servidor recusa, para a tela reverter', async () => {
      // A listagem faz rollback visual do seletor com base nesse erro.
      vi.mocked(api.post).mockRejectedValueOnce(new Error('403'))

      await expect(
        vendorsService.updateSubscriptionTier('v-1', 'premium'),
      ).rejects.toThrow()
    })
  })
})
