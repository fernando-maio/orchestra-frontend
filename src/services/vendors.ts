import api from './api'
import type { Vendor, Category, PaginationMeta } from '@/types'

export interface VendorFilters {
  search?: string
  category_id?: string
  city?: string
  state?: string
  is_verified?: boolean
  accepts_urgent?: boolean
  is_active?: boolean
  is_local_business?: boolean
  is_sustainable?: boolean
  is_minority_owned?: boolean
  approval_status?: string
  subscription_tier?: string
  per_page?: number
  page?: number
}

export interface VendorFormData {
  trade_name: string
  legal_name?: string
  cnpj?: string
  email?: string
  phone?: string
  whatsapp?: string
  website?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  latitude?: number
  longitude?: number
  service_radius_km?: number
  description?: string
  accepts_urgent?: boolean
  is_local_business?: boolean
  is_sustainable?: boolean
  is_minority_owned?: boolean
  is_active?: boolean
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  category_ids?: string[]
}

export interface PaginatedVendors {
  data: Vendor[]
  meta: PaginationMeta
}

const vendorsService = {
  async list(filters: VendorFilters = {}): Promise<PaginatedVendors> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    const response = await api.get(`/vendors?${params.toString()}`)
    return {
      data: response.data.data,
      meta: response.data.meta,
    }
  },

  async get(id: string): Promise<Vendor> {
    const response = await api.get(`/vendors/${id}`)
    return response.data.data
  },

  async create(data: VendorFormData): Promise<Vendor> {
    const response = await api.post('/vendors', data)
    return response.data.data
  },

  async update(id: string, data: Partial<VendorFormData>): Promise<Vendor> {
    const response = await api.put(`/vendors/${id}`, data)
    return response.data.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vendors/${id}`)
  },

  async toggleActive(id: string): Promise<Vendor> {
    const response = await api.post(`/vendors/${id}/toggle-active`)
    return response.data.data
  },

  async verify(id: string): Promise<Vendor> {
    const response = await api.post(`/vendors/${id}/verify`)
    return response.data.data
  },

  async approve(id: string): Promise<Vendor> {
    const response = await api.post(`/vendors/${id}/approve`)
    return response.data.data
  },

  async reject(id: string, reason: string): Promise<Vendor> {
    const response = await api.post(`/vendors/${id}/reject`, { reason })
    return response.data.data
  },

  async getCompliance(id: string): Promise<Record<string, unknown>> {
    const response = await api.get(`/vendors/${id}/compliance`)
    return response.data.data
  },

  async getCategories(): Promise<Category[]> {
    const response = await api.get('/categories')
    return response.data.data
  },
}

export default vendorsService
