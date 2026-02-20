import api from './api'
import type { Event, PaginationMeta } from '@/types'

export interface EventFilters {
  search?: string
  status?: string
  city?: string
  state?: string
  start_from?: string
  start_to?: string
  upcoming?: boolean
  past?: boolean
  organization_id?: string
  per_page?: number
  page?: number
}

export interface EventFormData {
  name: string
  description?: string
  briefing?: string
  start_date: string
  end_date?: string
  start_time?: string
  end_time?: string
  venue_name?: string
  address: string
  city: string
  state: string
  zip_code?: string
  latitude?: number
  longitude?: number
  estimated_budget?: number
  expected_attendees?: number
}

export interface PaginatedEvents {
  data: Event[]
  meta: PaginationMeta
}

const eventsService = {
  async list(filters: EventFilters = {}): Promise<PaginatedEvents> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    const response = await api.get(`/events?${params.toString()}`)
    return {
      data: response.data.data,
      meta: response.data.meta,
    }
  },

  async get(id: string): Promise<Event> {
    const response = await api.get(`/events/${id}`)
    return response.data.data
  },

  async create(data: EventFormData): Promise<Event> {
    const response = await api.post('/events', data)
    return response.data.data
  },

  async update(id: string, data: Partial<EventFormData>): Promise<Event> {
    const response = await api.put(`/events/${id}`, data)
    return response.data.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/events/${id}`)
  },

  async updateStatus(id: string, status: string): Promise<Event> {
    const response = await api.post(`/events/${id}/status`, { status })
    return response.data.data
  },

  async duplicate(id: string): Promise<Event> {
    const response = await api.post(`/events/${id}/duplicate`)
    return response.data.data
  },

  async getStatistics(id: string): Promise<Record<string, unknown>> {
    const response = await api.get(`/events/${id}/statistics`)
    return response.data.data
  },

  async getUpcoming(limit: number = 5): Promise<Event[]> {
    const response = await api.get(`/events/upcoming?limit=${limit}`)
    return response.data.data
  },
}

export default eventsService
