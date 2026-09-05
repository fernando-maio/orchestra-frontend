import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import VendorFormView from '../VendorFormView.vue'
import vendorsService from '@/services/vendors'

const push = vi.fn()
const toast = { success: vi.fn(), error: vi.fn() }
const params: Record<string, string | undefined> = {}

vi.mock('vue-router', () => ({
  useRoute: () => ({ params }),
  useRouter: () => ({ push }),
}))
vi.mock('vue-toastification', () => ({ useToast: () => toast }))
vi.mock('@/services/vendors', () => ({
  default: { get: vi.fn(), create: vi.fn(), update: vi.fn(), getCategories: vi.fn() },
}))

const fornecedor = () => ({
  id: 'v1', trade_name: 'SomMax Produções', legal_name: 'SomMax Ltda',
  cnpj: '23.456.789/0001-02', email: 'comercial@sommax.com.br',
  phone: '(11) 2345-6789', website: 'https://sommax.com.br',
  description: 'Referência em som.', city: 'São Paulo', state: 'SP',
  zip_code: '01310-100', service_radius_km: 100, subscription_tier: 'free',
  categories: [{ id: 'c1', name: 'Som e Iluminação' }],
})

const montar = async () => {
  const wrapper = mount(VendorFormView, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
  await flushPromises()
  return wrapper
}

describe('VendorFormView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete params.id
    vi.mocked(vendorsService.getCategories).mockResolvedValue([
      { id: 'c1', name: 'Som e Iluminação', icon: 'lightbulb' },
    ] as never)
  })

  describe('criação', () => {
    it('abre com o formulário vazio', async () => {
      const w = await montar()

      expect(vendorsService.get).not.toHaveBeenCalled()
      expect((w.find('#trade_name').element as HTMLInputElement).value).toBe('')
    })

    it('carrega as categorias para seleção', async () => {
      const w = await montar()

      expect(vendorsService.getCategories).toHaveBeenCalled()
      expect(w.text()).toContain('Som e Iluminação')
    })

    it('mostra o campo de plano de patrocínio', async () => {
      // O campo existia no banco e no Resource, mas não era validado em
      // nenhum Request — o formulário nunca conseguia salvá-lo.
      const w = await montar()

      expect(w.find('#subscription_tier').exists()).toBe(true)
    })

    it('envia o cadastro e volta para a listagem', async () => {
      vi.mocked(vendorsService.create).mockResolvedValueOnce(fornecedor() as never)
      const w = await montar()

      // O formulário valida no cliente antes de enviar: sem os obrigatórios
      // o submit nem chega ao service.
      await w.find('#trade_name').setValue('Novo Fornecedor')
      await w.find('#email').setValue('novo@fornecedor.com.br')
      await w.find('#city').setValue('São Paulo')
      await w.find('#state').setValue('SP')
      await w.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(vendorsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ trade_name: 'Novo Fornecedor' }),
      )
      expect(toast.success).toHaveBeenCalled()
    })

    it('barra o envio quando faltam campos obrigatórios', async () => {
      const w = await montar()

      await w.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(vendorsService.create).not.toHaveBeenCalled()
      expect(w.text()).toContain('é obrigatório')
    })

    it('mostra os erros de validação da API', async () => {
      vi.mocked(vendorsService.create).mockRejectedValueOnce({
        response: { status: 422, data: { errors: { cnpj: ['Este CNPJ já está cadastrado.'] } } },
      })
      const w = await montar()

      await w.find('#trade_name').setValue('Novo Fornecedor')
      await w.find('#email').setValue('novo@fornecedor.com.br')
      await w.find('#city').setValue('São Paulo')
      await w.find('#state').setValue('SP')
      await w.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(w.text()).toContain('Este CNPJ já está cadastrado.')
      expect(push).not.toHaveBeenCalled()
    })
  })

  describe('edição', () => {
    beforeEach(() => {
      params.id = 'v1'
      vi.mocked(vendorsService.get).mockResolvedValue(fornecedor() as never)
    })

    it('carrega o fornecedor e preenche o formulário', async () => {
      const w = await montar()

      expect(vendorsService.get).toHaveBeenCalledWith('v1')
      expect((w.find('#trade_name').element as HTMLInputElement).value).toBe('SomMax Produções')
      expect((w.find('#cnpj').element as HTMLInputElement).value).toBe('23.456.789/0001-02')
    })

    it('chama update, e não create', async () => {
      vi.mocked(vendorsService.update).mockResolvedValueOnce(fornecedor() as never)
      const w = await montar()

      await w.find('form').trigger('submit.prevent')
      await flushPromises()

      expect(vendorsService.update).toHaveBeenCalledWith('v1', expect.anything())
      expect(vendorsService.create).not.toHaveBeenCalled()
    })

    it('avisa quando o fornecedor não existe', async () => {
      vi.mocked(vendorsService.get).mockRejectedValueOnce({ response: { status: 404 } })
      vi.spyOn(console, 'error').mockImplementation(() => {})

      await montar()

      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('os inputs têm a classe de estilo aplicada', async () => {
    // Regressão: usavam form-input, classe do plugin @tailwindcss/forms que
    // não está instalado — renderizavam sem borda nenhuma.
    const w = await montar()

    expect(w.find('#trade_name').classes()).toContain('input')
    expect(w.html()).not.toContain('form-input')
  })
})
