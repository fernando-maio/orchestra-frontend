import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import NotFoundView from '@/views/NotFoundView.vue'
import QuotesListView from '@/views/quotes/QuotesListView.vue'
import QuoteDetailView from '@/views/quotes/QuoteDetailView.vue'
import ProposalsListView from '@/views/proposals/ProposalsListView.vue'
import ProposalDetailView from '@/views/proposals/ProposalDetailView.vue'
import PublicProposalView from '@/views/proposals/PublicProposalView.vue'
import VendorRegisterSuccessView from '@/views/public/VendorRegisterSuccessView.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: 'x', token: 'tok' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))

const stubs = { RouterLink: { template: '<a><slot /></a>' } }

const comPinia = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useAuthStore()
  store.user = {
    id: 'u1', name: 'T', email: 't@e.com', organization_id: 'o1',
    is_active: true, organization: null, roles: ['admin'], permissions: [],
  } as never
  store.token = 'tok'
  return pinia
}

describe('NotFoundView', () => {
  it('mostra o 404 e o caminho de volta', () => {
    const w = mount(NotFoundView, { global: { stubs } })

    expect(w.text()).toContain('404')
    expect(w.text()).toContain('não encontrada')
    expect(w.text()).toContain('Voltar ao início')
  })
})

describe('VendorRegisterSuccessView', () => {
  it('confirma o envio e explica o que acontece a seguir', () => {
    // O fornecedor não tem acesso ao sistema: esta tela é o único retorno que
    // ele recebe depois de se cadastrar.
    const w = mount(VendorRegisterSuccessView, { global: { stubs } })

    expect(w.text().toLowerCase()).toContain('sucesso')
  })
})

/**
 * Telas ainda não implementadas (Fase 3 do roadmap). O teste garante que os
 * placeholders montam e comunicam o estado, em vez de quebrar a navegação.
 */
describe('placeholders da Fase 3', () => {
  it.each([
    ['QuotesListView', QuotesListView],
    ['QuoteDetailView', QuoteDetailView],
    ['ProposalsListView', ProposalsListView],
    ['ProposalDetailView', ProposalDetailView],
    ['PublicProposalView', PublicProposalView],
  ])('%s monta sem erro e informa o usuário', (_nome, componente) => {
    const w = mount(componente, { global: { plugins: [comPinia()], stubs } })

    expect(w.html()).toBeTruthy()
    expect(w.text().length).toBeGreaterThan(0)
  })
})
