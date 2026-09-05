import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import Sidebar from '../Sidebar.vue'

vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/' }) }))

const montar = (roles: string[], organization: unknown = null) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useAuthStore()
  store.user = {
    id: 'u1', name: 'T', email: 't@e.com', organization_id: 'o1',
    is_active: true, organization, roles, permissions: [],
  } as never
  store.token = 'tok'

  return mount(Sidebar, {
    global: { plugins: [pinia], stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
}

describe('Sidebar', () => {
  it('mostra o menu da plataforma para o super-admin', () => {
    const w = montar(['super-admin'])

    expect(w.text()).toContain('Dashboard Admin')
    expect(w.text()).toContain('Organizações')
    expect(w.text()).toContain('Categorias')
  })

  it('mostra o menu do cliente para o admin da organização', () => {
    const w = montar(['admin'])

    expect(w.text()).toContain('Eventos')
    expect(w.text()).toContain('Fornecedores')
    // Itens exclusivos da plataforma não aparecem.
    expect(w.text()).not.toContain('Dashboard Admin')
    expect(w.text()).not.toContain('Organizações')
  })

  it.each([['organizer'], ['viewer']])(
    'usa o menu do cliente também para %s',
    (papel) => {
      // Hoje a navegação só diverge em isSuperAdmin; organizer e viewer veem
      // o mesmo menu do admin, e o que os separa são os gates por permissão
      // dentro de cada tela.
      const w = montar([papel])

      expect(w.text()).toContain('Eventos')
      expect(w.text()).not.toContain('Dashboard Admin')
    },
  )

  it('exibe o nome da organização quando existe', () => {
    const w = montar(['admin'], { id: 'o1', name: 'Empresa Demo' })

    expect(w.text()).toContain('Empresa Demo')
  })
})
