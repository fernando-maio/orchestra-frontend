/**
 * Todas as tabelas do Orchestra usam UUID como primary key (trait HasUuid),
 * entao rotas de detalhe terminam em UUID e nao em inteiro.
 */
export const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

/**
 * Monta o padrao de uma rota de detalhe, por exemplo `/events/:id`.
 */
export function detailRoute(prefix: string): RegExp {
  return new RegExp(`/${prefix}/${UUID}`, 'i')
}
