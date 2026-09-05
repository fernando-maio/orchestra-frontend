import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import Navbar from '../Navbar.vue'
import AppLayout from '../AppLayout.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/' }),
  useRouter: () => ({ push: vi.fn() }),
}))

const comStore = (nome = 'Usuário Demo') => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useAuthStore()
  store.user = {
    id: 'u1', name: nome, email: 'd@e.com', organization_id: 'o1',
    is_active: true, organization: { id: 'o1', name: 'Empresa Demo' },
    roles: ['admin'], permissions: [],
  } as never
  store.token = 'tok'
  return { pinia, store }
}

const stubs = {
  RouterLink: { template: '<a><slot /></a>' },
  RouterView: { template: '<div />' },
}

describe('Navbar', () => {
  it('mostra o nome do usuário logado', () => {
    const { pinia } = comStore()
    const w = mount(Navbar, { global: { plugins: [pinia], stubs } })

    expect(w.text()).toContain('Usuário Demo')
  })

  it('esconde o menu do usuário até ser aberto', () => {
    const { pinia } = comStore()
    const w = mount(Navbar, { global: { plugins: [pinia], stubs } })

    expect(w.text()).not.toMatch(/sair/i)
  })

  it('emite logout ao acionar a saída no menu aberto', async () => {
    // O componente não faz o logout: emite para o layout decidir. O botão fica
    // dentro do dropdown, que precisa ser aberto primeiro.
    const { pinia } = comStore()
    const w = mount(Navbar, { global: { plugins: [pinia], stubs } })

    const abrir = w.findAll('button').find(b => b.text().includes('Usuário Demo'))
    await abrir?.trigger('click')

    const sair = w.findAll('button').find(b => b.text().match(/sair/i))
    await sair?.trigger('click')

    expect(w.emitted('logout')).toBeTruthy()
  })

  it('mostra a inicial do usuário no avatar', () => {
    const { pinia } = comStore('Fernando')
    const w = mount(Navbar, { global: { plugins: [pinia], stubs } })

    expect(w.text()).toContain('F')
  })
})

describe('AppLayout', () => {
  it('monta a sidebar e a navbar juntas', () => {
    const { pinia } = comStore()
    const w = mount(AppLayout, { global: { plugins: [pinia], stubs } })

    expect(w.text()).toContain('Usuário Demo')
    expect(w.text()).toContain('Eventos')
  })
})
