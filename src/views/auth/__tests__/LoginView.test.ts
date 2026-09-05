import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import LoginView from '../LoginView.vue'

const push = vi.fn()
const query: Record<string, string> = {}
const toast = { success: vi.fn(), error: vi.fn() }

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => ({ query }),
}))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))

const montar = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useAuthStore()
  const login = vi.spyOn(store, 'login').mockResolvedValue(undefined as never)

  return { wrapper: mount(LoginView, { global: { plugins: [pinia] } }), store, login }
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const k of Object.keys(query)) delete query[k]
  })

  it('mostra os campos e o botão de entrar', () => {
    const { wrapper } = montar()

    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('Entrar')
  })

  it('envia as credenciais preenchidas para a store', async () => {
    const { wrapper, login } = montar()

    await wrapper.find('#email').setValue('demo@orchestra.local')
    await wrapper.find('#password').setValue('password')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(login).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'demo@orchestra.local', password: 'password' }),
    )
  })

  it('redireciona para a raiz após autenticar', async () => {
    const { wrapper } = montar()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(toast.success).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/')
  })

  it('respeita o redirect da query string', async () => {
    // O guard do router manda para /login?redirect=/events quando a sessão
    // expira; depois de entrar, o usuário precisa voltar para onde estava.
    query.redirect = '/events'
    const { wrapper } = montar()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(push).toHaveBeenCalledWith('/events')
  })

  it('mostra os erros de validação por campo', async () => {
    const { wrapper, login } = montar()
    login.mockRejectedValueOnce({
      response: { status: 422, data: { errors: { email: ['As credenciais informadas estão incorretas.'] } } },
    })

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('As credenciais informadas estão incorretas.')
    expect(push).not.toHaveBeenCalled()
  })

  it('usa o toast quando o erro não é de validação', async () => {
    const { wrapper, login } = montar()
    login.mockRejectedValueOnce({ response: { data: { message: 'Conta desativada.' } } })

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('Conta desativada.')
  })

  it('cai numa mensagem genérica quando o erro não traz texto', async () => {
    const { wrapper, login } = montar()
    login.mockRejectedValueOnce(new Error('Network Error'))

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('Erro ao fazer login. Tente novamente.')
  })

  it('libera o botão depois de uma falha', async () => {
    // Sem o finally, um erro deixaria o formulário travado em "entrando...".
    const { wrapper, login } = montar()
    login.mockRejectedValueOnce(new Error('x'))

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })
})
