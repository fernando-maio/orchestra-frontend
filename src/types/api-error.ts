/**
 * Forma do erro que a API do Laravel devolve.
 *
 * Existe para substituir o `catch (error: any)` que estava espalhado pelas
 * views: `any` desliga a verificação de tipos justamente no ponto onde o dado
 * vem de fora e é menos confiável.
 */
export interface ApiErrorResponse {
  response?: {
    status?: number
    data?: {
      message?: string
      errors?: Record<string, string[]>
    }
  }
}

/**
 * Extrai os erros de validação (422) da resposta, se houver.
 */
export function getValidationErrors(error: unknown): Record<string, string[]> | null {
  return (error as ApiErrorResponse)?.response?.data?.errors ?? null
}

/**
 * Extrai a mensagem de erro da API, com um texto de reserva.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  return (error as ApiErrorResponse)?.response?.data?.message ?? fallback
}
