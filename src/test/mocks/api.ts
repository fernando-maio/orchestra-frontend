import { vi } from 'vitest'

export function mockAxios() {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    defaults: {
      headers: { common: {} },
    },
  }

  return mockInstance
}

export function mockApiResponse<T>(data: T, status = 200) {
  return Promise.resolve({ data, status, statusText: 'OK', headers: {}, config: {} })
}

export function mockApiError(status: number, message = 'Error') {
  return Promise.reject({
    response: {
      status,
      data: { message },
    },
    isAxiosError: true,
  })
}

export function mockPaginatedResponse<T>(data: T[], page = 1, total = 10, perPage = 15) {
  return mockApiResponse({
    data,
    meta: {
      current_page: page,
      last_page: Math.ceil(total / perPage),
      per_page: perPage,
      total,
      from: (page - 1) * perPage + 1,
      to: Math.min(page * perPage, total),
    },
    links: {},
  })
}
