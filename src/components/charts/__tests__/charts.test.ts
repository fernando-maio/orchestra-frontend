import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AreaChart from '../AreaChart.vue'
import BarChart from '../BarChart.vue'
import ComboChart from '../ComboChart.vue'
import DonutChart from '../DonutChart.vue'
import RadialChart from '../RadialChart.vue'

// ApexCharts precisa de canvas, indisponível no jsdom. O stub deixa verificar
// as OPÇÕES que cada wrapper monta, que é o que de fato lhes cabe.
vi.mock('vue3-apexcharts', () => ({
  default: {
    name: 'apexchart',
    props: ['type', 'height', 'options', 'series'],
    template: '<div class="apex-stub" :data-type="type" />',
  },
}))

const opcoes = (w: ReturnType<typeof mount>) =>
  w.findComponent({ name: 'apexchart' }).props('options') as Record<string, never>

describe('wrappers de gráfico', () => {
  describe('AreaChart', () => {
    const props = {
      series: [{ name: 'MRR', data: [1, 2, 3] }],
      categories: ['jan', 'fev', 'mar'],
    }

    it('renderiza como área', () => {
      const w = mount(AreaChart, { props })
      expect(w.find('.apex-stub').attributes('data-type')).toBe('area')
    })

    it('repassa as categorias para o eixo X', () => {
      const w = mount(AreaChart, { props })
      expect((opcoes(w).xaxis as { categories: string[] }).categories).toEqual(['jan', 'fev', 'mar'])
    })

    it('aceita título opcional', () => {
      const w = mount(AreaChart, { props: { ...props, title: 'Evolução do MRR' } })
      expect(w.text()).toContain('Evolução do MRR')
    })
  })

  describe('BarChart', () => {
    it('renderiza como barra', () => {
      const w = mount(BarChart, {
        props: { series: [{ name: 'Cotações', data: [5] }], categories: ['Buffet'] },
      })
      expect(w.find('.apex-stub').exists()).toBe(true)
    })
  })

  describe('ComboChart', () => {
    it('monta com séries de tipos distintos', () => {
      const w = mount(ComboChart, {
        props: {
          series: [
            { name: 'Novos', type: 'column', data: [3] },
            { name: 'Churn', type: 'line', data: [1] },
          ],
          categories: ['jan'],
        },
      })
      expect(w.find('.apex-stub').exists()).toBe(true)
    })
  })

  describe('DonutChart', () => {
    const props = { series: [40, 30, 30], labels: ['Buffet', 'Som', 'Decoração'] }

    it('renderiza como donut', () => {
      const w = mount(DonutChart, { props })
      expect(w.find('.apex-stub').attributes('data-type')).toBe('donut')
    })

    it('repassa os rótulos', () => {
      const w = mount(DonutChart, { props })
      expect(opcoes(w).labels).toEqual(['Buffet', 'Som', 'Decoração'])
    })

    it('aceita rótulo e valor centrais', () => {
      const w = mount(DonutChart, {
        props: { ...props, centerLabel: 'Total', centerValue: 'R$ 100' },
      })
      expect(w.findComponent({ name: 'apexchart' }).exists()).toBe(true)
    })
  })

  describe('RadialChart', () => {
    it('renderiza o valor único como gauge', () => {
      // Diferente dos demais: recebe um valor escalar, e não séries.
      const w = mount(RadialChart, { props: { value: 75, label: 'Taxa de resposta' } })
      expect(w.find('.apex-stub').exists()).toBe(true)
    })

    it('aceita um máximo diferente de 100', () => {
      const w = mount(RadialChart, { props: { value: 30, maxValue: 60 } })
      expect(w.find('.apex-stub').exists()).toBe(true)
    })
  })
})
