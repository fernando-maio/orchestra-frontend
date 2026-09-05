import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import SettingsView from '../SettingsView.vue'
import api from '@/services/api'

vi.mock('@/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const montar = async () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useAuthStore()
  store.user = {
    id: 'u1', name: 'Super Admin', email: 'admin@orchestra.local',
    organization_id: null, is_active: true, organization: null,
    roles: ['super-admin'], permissions: [],
  } as never
  store.token = 'tok'
  vi.spyOn(store, 'fetchUser').mockResolvedValue(undefined as never)

  const wrapper = mount(SettingsView, { global: { plugins: [pinia] } })
  // onMounted preenche o formulário a partir da store; a re-renderização só
  // acontece no tick seguinte, então sem isto o DOM ainda está vazio.
  await nextTick()

  return { wrapper, store }
}

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('perfil', () => {
    it('preenche o formulário com os dados do usuário logado', async () => {
      const { wrapper } = await montar()

      expect((wrapper.find('#name').element as HTMLInputElement).value).toBe('Super Admin')
      expect((wrapper.find('#email').element as HTMLInputElement).value).toBe('admin@orchestra.local')
    })

    it('deixa o e-mail somente leitura', async () => {
      // O e-mail é a credencial de login: alterá-lo exige fluxo com
      // verificação. O backend também ignora o campo.
      const { wrapper } = await montar()
      const email = wrapper.find('#email').element as HTMLInputElement

      expect(email.disabled).toBe(true)
      expect(email.readOnly).toBe(true)
    })

    it('salva o perfil e recarrega o usuário', async () => {
      vi.mocked(api.put).mockResolvedValueOnce({ data: {} })
      const { wrapper, store } = await montar()

      await wrapper.find('#name').setValue('Nome Novo')
      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(api.put).toHaveBeenCalledWith('/auth/profile', expect.objectContaining({
        name: 'Nome Novo',
      }))
      // Sem o fetchUser o nome no cabeçalho continuaria o antigo.
      expect(store.fetchUser).toHaveBeenCalled()
    })

    it('mostra os erros de validação vindos da API', async () => {
      vi.mocked(api.put).mockRejectedValueOnce({
        response: { status: 422, data: { errors: { name: ['O nome é obrigatório.'] } } },
      })
      const { wrapper } = await montar()

      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.text()).toContain('O nome é obrigatório.')
    })

    it('não trava o botão quando a requisição falha', async () => {
      // O `finally` precisa devolver saving para false, senão o formulário
      // fica inutilizável após um erro.
      vi.mocked(api.put).mockRejectedValueOnce(new Error('rede'))
      const { wrapper } = await montar()

      await wrapper.find('form').trigger('submit.prevent')
      await flushPromises()

      const botao = wrapper.findAll('button[type="submit"]')[0]!
      expect(botao.attributes('disabled')).toBeUndefined()
    })
  })

  describe('troca de senha', () => {
    it('envia as três senhas para o endpoint', async () => {
      // O payload é o objeto reativo passwordForm, passado por referência — e
      // changePassword o esvazia no sucesso. Sem tirar uma cópia no momento
      // da chamada, a asserção leria o objeto já limpo e veria strings vazias.
      let enviado: Record<string, string> | null = null
      vi.mocked(api.put).mockImplementationOnce(async (_url, dados) => {
        enviado = { ...(dados as Record<string, string>) }
        return { data: {} } as never
      })
      const { wrapper } = await montar()

      await wrapper.find('#current_password').setValue('atual')
      await wrapper.find('#new_password').setValue('nova-senha')
      await wrapper.find('#password_confirmation').setValue('nova-senha')
      await wrapper.findAll('form')[1]!.trigger('submit.prevent')
      await flushPromises()

      expect(api.put).toHaveBeenCalledWith('/auth/password', expect.anything())
      expect(enviado).toEqual({
        current_password: 'atual',
        password: 'nova-senha',
        password_confirmation: 'nova-senha',
      })
    })

    it('limpa os campos após sucesso', async () => {
      // Deixar a senha no formulário depois de trocada é risco desnecessário.
      vi.mocked(api.put).mockResolvedValueOnce({ data: {} })
      const { wrapper } = await montar()

      await wrapper.find('#current_password').setValue('atual')
      await wrapper.find('#new_password').setValue('nova-senha')
      await wrapper.findAll('form')[1]!.trigger('submit.prevent')
      await flushPromises()

      expect((wrapper.find('#current_password').element as HTMLInputElement).value).toBe('')
      expect((wrapper.find('#new_password').element as HTMLInputElement).value).toBe('')
    })

    it('mostra o erro quando a senha atual está incorreta', async () => {
      vi.mocked(api.put).mockRejectedValueOnce({
        response: {
          status: 422,
          data: { errors: { current_password: ['A senha atual está incorreta.'] } },
        },
      })
      const { wrapper } = await montar()

      await wrapper.findAll('form')[1]!.trigger('submit.prevent')
      await flushPromises()

      expect(wrapper.text()).toContain('A senha atual está incorreta.')
    })

    it('não limpa os campos quando a troca falha', async () => {
      vi.mocked(api.put).mockRejectedValueOnce({
        response: { status: 422, data: { errors: { current_password: ['Incorreta.'] } } },
      })
      const { wrapper } = await montar()

      await wrapper.find('#current_password').setValue('chute')
      await wrapper.findAll('form')[1]!.trigger('submit.prevent')
      await flushPromises()

      // Limpar aqui obrigaria o usuário a redigitar tudo por causa de um erro.
      expect((wrapper.find('#current_password').element as HTMLInputElement).value).toBe('chute')
    })
  })
})
