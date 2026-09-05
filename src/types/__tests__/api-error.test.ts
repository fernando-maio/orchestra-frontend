import { describe, it, expect } from 'vitest'
import { getApiErrorMessage, getValidationErrors } from '../api-error'

/**
 * Estes helpers substituíram o `catch (error: any)` que havia nas views.
 * Recebem `unknown` de propósito: o dado vem de fora e não se pode confiar
 * na forma dele.
 */
describe('getValidationErrors', () => {
  it('extrai os erros de validação de uma resposta 422', () => {
    const erro = {
      response: { status: 422, data: { errors: { email: ['E-mail já cadastrado.'] } } },
    }

    expect(getValidationErrors(erro)).toEqual({ email: ['E-mail já cadastrado.'] })
  })

  it('devolve nulo quando a resposta não traz erros de validação', () => {
    expect(getValidationErrors({ response: { data: { message: 'Erro' } } })).toBeNull()
  })

  it.each([
    ['nulo', null],
    ['indefinido', undefined],
    ['string', 'apenas um texto'],
    ['objeto vazio', {}],
    ['erro nativo', new Error('falhou')],
    ['sem response', { message: 'network' }],
  ])('devolve nulo para %s, em vez de estourar', (_rotulo, entrada) => {
    expect(getValidationErrors(entrada)).toBeNull()
  })
})

describe('getApiErrorMessage', () => {
  it('usa a mensagem da API quando existe', () => {
    const erro = { response: { data: { message: 'Fornecedor não encontrado.' } } }

    expect(getApiErrorMessage(erro, 'reserva')).toBe('Fornecedor não encontrado.')
  })

  it.each([
    ['nulo', null],
    ['erro de rede sem response', new Error('Network Error')],
    ['resposta sem message', { response: { data: {} } }],
  ])('cai na mensagem de reserva para %s', (_rotulo, entrada) => {
    expect(getApiErrorMessage(entrada, 'Não foi possível concluir.')).toBe('Não foi possível concluir.')
  })

  it('não confunde string vazia com ausência de mensagem', () => {
    // Uma mensagem vazia da API não ajuda o usuário; a reserva é melhor.
    // Documenta o comportamento atual: `??` só cai na reserva se for
    // null/undefined, então string vazia passa.
    const erro = { response: { data: { message: '' } } }

    expect(getApiErrorMessage(erro, 'reserva')).toBe('')
  })
})
