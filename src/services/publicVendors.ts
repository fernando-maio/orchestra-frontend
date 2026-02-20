import api from './api'
import type { Category, Vendor } from '@/types'

export interface VendorRegistrationData {
  trade_name: string
  legal_name?: string
  cnpj: string
  email: string
  phone?: string
  whatsapp?: string
  website?: string
  address?: string
  city: string
  state: string
  zip_code?: string
  service_radius_km?: number
  description?: string
  accepts_urgent?: boolean
  is_local_business?: boolean
  is_sustainable?: boolean
  is_minority_owned?: boolean
  contact_name: string
  contact_email: string
  contact_phone: string
  category_ids: string[]
}

const publicVendorsService = {
  async getCategories(): Promise<Category[]> {
    const response = await api.get('/public/vendors/categories')
    return response.data.data
  },

  async register(data: VendorRegistrationData): Promise<Vendor> {
    const response = await api.post('/public/vendors/register', data)
    return response.data.data
  },

  async checkCnpj(cnpj: string): Promise<{ exists: boolean; message?: string }> {
    const response = await api.post('/public/vendors/check-cnpj', { cnpj })
    return response.data
  },

  async checkEmail(email: string): Promise<{ exists: boolean; message?: string }> {
    const response = await api.post('/public/vendors/check-email', { email })
    return response.data
  },
}

export default publicVendorsService
