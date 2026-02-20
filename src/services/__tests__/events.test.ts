import { describe, it, expect, vi, beforeEach } from 'vitest'
import eventsService from '@/services/events'

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

const mockEvent = {
  id: 'event-uuid-1',
  name: 'Test Event',
  status: 'draft',
  start_date: '2026-06-15',
  end_date: '2026-06-17',
  city: 'São Paulo',
  state: 'SP',
  estimated_budget: 50000,
}

describe('Events Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('should fetch events with filters', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          data: [mockEvent],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        },
      })

      const result = await eventsService.list({ status: 'draft', page: 1 })

      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/events?'))
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('status=draft'))
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.name).toBe('Test Event')
    })

    it('should skip empty filter values', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } },
      })

      await eventsService.list({ search: '', status: undefined })

      const callArg = vi.mocked(api.get).mock.calls[0]![0]
      expect(callArg).not.toContain('search=')
      expect(callArg).not.toContain('status=')
    })
  })

  describe('get', () => {
    it('should fetch single event', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: mockEvent } })

      const result = await eventsService.get('event-uuid-1')

      expect(api.get).toHaveBeenCalledWith('/events/event-uuid-1')
      expect(result.name).toBe('Test Event')
    })
  })

  describe('create', () => {
    it('should create event with form data', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: mockEvent } })

      const formData = {
        name: 'Test Event',
        start_date: '2026-06-15',
        address: 'Rua Test',
        city: 'São Paulo',
        state: 'SP',
      }

      const result = await eventsService.create(formData)

      expect(api.post).toHaveBeenCalledWith('/events', formData)
      expect(result.id).toBe('event-uuid-1')
    })
  })

  describe('update', () => {
    it('should update event', async () => {
      const updated = { ...mockEvent, name: 'Updated Event' }
      vi.mocked(api.put).mockResolvedValueOnce({ data: { data: updated } })

      const result = await eventsService.update('event-uuid-1', { name: 'Updated Event' })

      expect(api.put).toHaveBeenCalledWith('/events/event-uuid-1', { name: 'Updated Event' })
      expect(result.name).toBe('Updated Event')
    })
  })

  describe('delete', () => {
    it('should delete event', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: {} })

      await eventsService.delete('event-uuid-1')

      expect(api.delete).toHaveBeenCalledWith('/events/event-uuid-1')
    })
  })

  describe('updateStatus', () => {
    it('should update event status', async () => {
      const updated = { ...mockEvent, status: 'active' }
      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: updated } })

      const result = await eventsService.updateStatus('event-uuid-1', 'active')

      expect(api.post).toHaveBeenCalledWith('/events/event-uuid-1/status', { status: 'active' })
      expect(result.status).toBe('active')
    })
  })

  describe('duplicate', () => {
    it('should duplicate event', async () => {
      const duplicated = { ...mockEvent, id: 'event-uuid-2', name: 'Test Event (cópia)' }
      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: duplicated } })

      const result = await eventsService.duplicate('event-uuid-1')

      expect(api.post).toHaveBeenCalledWith('/events/event-uuid-1/duplicate')
      expect(result.id).toBe('event-uuid-2')
    })
  })

  describe('getStatistics', () => {
    it('should fetch event statistics', async () => {
      const stats = { total_quote_requests: 5, total_proposals: 12 }
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: stats } })

      const result = await eventsService.getStatistics('event-uuid-1')

      expect(api.get).toHaveBeenCalledWith('/events/event-uuid-1/statistics')
      expect(result).toEqual(stats)
    })
  })

  describe('getUpcoming', () => {
    it('should fetch upcoming events', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [mockEvent] } })

      const result = await eventsService.getUpcoming(3)

      expect(api.get).toHaveBeenCalledWith('/events/upcoming?limit=3')
      expect(result).toHaveLength(1)
    })
  })
})
