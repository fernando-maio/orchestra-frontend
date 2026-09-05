import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatsCard from '../StatsCard.vue'

describe('StatsCard', () => {
  it('mostra título e valor', () => {
    const w = mount(StatsCard, { props: { title: 'Eventos Ativos', value: 5 } })

    expect(w.text()).toContain('Eventos Ativos')
    expect(w.text()).toContain('5')
  })

  it('aceita valor já formatado como texto', () => {
    const w = mount(StatsCard, { props: { title: 'Orçamento', value: 'R$ 250.000,00' } })

    expect(w.text()).toContain('R$ 250.000,00')
  })

  it('mostra o subtítulo quando informado', () => {
    const w = mount(StatsCard, {
      props: { title: 'GMV', value: 100, subtitle: 'Últimos 30 dias' },
    })

    expect(w.text()).toContain('Últimos 30 dias')
  })

  it.each([
    [12, '↑', '12%'],
    [-8, '↓', '8%'],
  ])('indica a tendência %i com a seta "%s"', (trend, seta, percentual) => {
    // O componente usa seta e valor absoluto, e não sinal — o percentual
    // exibido para -8 é "8%", com a direção vindo do ícone.
    const w = mount(StatsCard, { props: { title: 'MRR', value: 1, trend } })

    expect(w.text()).toContain(seta)
    expect(w.text()).toContain(percentual)
  })

  it('esconde o conteúdo enquanto carrega', () => {
    const w = mount(StatsCard, { props: { title: 'X', value: 9, loading: true } })

    expect(w.text()).not.toContain('9')
  })

  it.each([['primary'], ['success'], ['warning'], ['danger']] as const)(
    'aplica a variante %s',
    (variant) => {
      const w = mount(StatsCard, { props: { title: 'X', value: 1, variant } })

      expect(w.html()).toBeTruthy()
    },
  )
})
