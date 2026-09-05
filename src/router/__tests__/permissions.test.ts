import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

/**
 * O guard do router e a primeira barreira: sem ele o usuario percorre o
 * formulario inteiro e so descobre que nao pode ao tentar salvar.
 */
describe('guard de permissão nas rotas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  const autenticar = (permissions: string[], roles = ['admin']) => {
    const store = useAuthStore()
    store.user = {
      id: 'u1', name: 'Teste', email: 't@e.com',
      organization_id: 'o1', is_active: true, organization: null,
      roles, permissions,
    } as never
    store.token = 'tk'
  }

  it.each([
    ['/events/create', 'events.create'],
    ['/events/1/edit', 'events.update'],
    ['/vendors/create', 'vendors.create'],
    ['/vendors/1/edit', 'vendors.update'],
  ])('libera %s para quem tem %s', async (rota, permissao) => {
    autenticar([permissao])
    await router.push(rota)
    expect(router.currentRoute.value.path).toBe(rota)
  })

  it.each([
    ['/events/create'],
    ['/events/1/edit'],
    ['/vendors/create'],
    ['/vendors/1/edit'],
  ])('redireciona %s para quem não tem a permissão', async (rota) => {
    autenticar(['events.view', 'vendors.view'])   // perfil viewer
    await router.push(rota)
    expect(router.currentRoute.value.path).not.toBe(rota)
  })

  it('rotas de listagem continuam abertas para quem só visualiza', async () => {
    autenticar(['events.view', 'vendors.view'])
    await router.push('/events')
    expect(router.currentRoute.value.path).toBe('/events')
  })

  it('bloqueia rota de super-admin para quem não é', async () => {
    autenticar(['events.view'], ['admin'])
    await router.push('/organizations')
    expect(router.currentRoute.value.path).not.toBe('/organizations')
  })

  it('libera rota de super-admin para super-admin', async () => {
    autenticar(['organizations.view'], ['super-admin'])
    await router.push('/organizations')
    expect(router.currentRoute.value.path).toBe('/organizations')
  })
})
