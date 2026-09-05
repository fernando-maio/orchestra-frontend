import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryIcon from '../CategoryIcon.vue'

describe('CategoryIcon', () => {
  it('renderiza um SVG, e não o nome do ícone como texto', () => {
    // Era exatamente esse o bug: o template fazia {{ category.icon }} e a
    // string "utensils" aparecia na tela.
    const wrapper = mount(CategoryIcon, { props: { name: 'utensils' } })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('utensils')
  })

  it.each([
    ['utensils'], ['lightbulb'], ['building'], ['tv'], ['palette'],
    ['couch'], ['bolt'], ['shield'], ['broom'], ['truck'],
    ['wifi'], ['camera'], ['users'], ['music'], ['gift'],
  ])('mapeia o ícone "%s" usado pelos seeders', (name) => {
    const wrapper = mount(CategoryIcon, { props: { name } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('cai no ícone padrão para nome desconhecido, em vez de sumir', () => {
    const wrapper = mount(CategoryIcon, { props: { name: 'nao-existe-esse-icone' } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('cai no ícone padrão quando o nome é nulo', () => {
    const wrapper = mount(CategoryIcon, { props: { name: null } })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('é insensível a maiúsculas', () => {
    const maiusculo = mount(CategoryIcon, { props: { name: 'TRUCK' } })
    const minusculo = mount(CategoryIcon, { props: { name: 'truck' } })
    expect(maiusculo.html()).toBe(minusculo.html())
  })

  it('aplica o tamanho informado', () => {
    const wrapper = mount(CategoryIcon, { props: { name: 'gift', size: 32 } })
    expect(wrapper.find('svg').attributes('width')).toBe('32')
  })
})
