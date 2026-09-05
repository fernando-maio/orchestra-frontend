import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressBar from '../ProgressBar.vue'

const larguraDaBarra = (wrapper: ReturnType<typeof mount>) => {
  const barra = wrapper.find('.rounded-full.transition-all')
  return barra.attributes('style') ?? ''
}

describe('ProgressBar', () => {
  describe('dentro do orçamento', () => {
    it('mostra o percentual e não exibe aviso', () => {
      const w = mount(ProgressBar, { props: { value: 5000, max: 10000 } })

      expect(w.text()).toContain('50%')
      expect(w.text()).not.toContain('Estourou')
    })

    it('a largura da barra acompanha o percentual', () => {
      const w = mount(ProgressBar, { props: { value: 2500, max: 10000 } })
      expect(larguraDaBarra(w)).toContain('25%')
    })
  })

  describe('orçamento estourado', () => {
    it('mostra o percentual REAL, acima de 100', () => {
      // Regressao: o percentual era limitado com Math.min(..., 100) antes de
      // ser exibido, entao um estouro de 200% aparecia como "100%".
      const w = mount(ProgressBar, { props: { value: 20000, max: 10000 } })

      // Checa o span do percentual, e nao o texto todo: o aviso de estouro
      // tambem contem "%", e uma busca solta casaria com ele.
      expect(w.find('span.font-medium').text()).toBe('200%')
    })

    it('avisa quanto passou, em dinheiro', () => {
      const w = mount(ProgressBar, { props: { value: 20000, max: 10000 } })

      expect(w.text()).toContain('Estourou')
      expect(w.text()).toContain('10.000')
      expect(w.text()).toContain('100% acima do orçamento')
    })

    it('mantém a barra limitada a 100% para não vazar o container', () => {
      const w = mount(ProgressBar, { props: { value: 50000, max: 10000 } })
      expect(larguraDaBarra(w)).toContain('100%')
    })

    it('pinta de vermelho pela cor automática', () => {
      // Regressao: colorClass comparava o percentual JA limitado com "> 100",
      // condicao inalcancavel, entao o ramo vermelho era codigo morto.
      const w = mount(ProgressBar, { props: { value: 20000, max: 10000 } })
      expect(w.html()).toContain('bg-red-500')
    })
  })

  describe('faixas de cor automática', () => {
    it.each([
      [5000, 'bg-indigo-500'],
      [9000, 'bg-yellow-500'],
      [20000, 'bg-red-500'],
    ])('valor %i usa %s', (value, classe) => {
      const w = mount(ProgressBar, { props: { value, max: 10000 } })
      expect(w.html()).toContain(classe)
    })

    it('a variante explícita tem prioridade sobre a cor automática', () => {
      const w = mount(ProgressBar, { props: { value: 100, max: 10000, variant: 'danger' } })
      expect(w.html()).toContain('bg-red-500')
    })
  })

  describe('casos limite', () => {
    it('não divide por zero quando o máximo é zero', () => {
      const w = mount(ProgressBar, { props: { value: 5000, max: 0 } })

      expect(w.text()).toContain('0%')
      expect(w.text()).not.toContain('NaN')
      expect(w.text()).not.toContain('Infinity')
    })

    it('trata valor negativo como zero', () => {
      const w = mount(ProgressBar, { props: { value: -500, max: 10000 } })
      expect(w.text()).toContain('0%')
    })

    it('exatamente no limite não é considerado estouro', () => {
      const w = mount(ProgressBar, { props: { value: 10000, max: 10000 } })

      expect(w.text()).toContain('100%')
      expect(w.text()).not.toContain('Estourou')
    })
  })
})
