import { describe, it, expect } from 'vitest'
import { computed, ref } from 'vue'

/**
 * Espelha a lógica de `complianceInfo` do VendorDetailView.
 *
 * O bug original: a API devolve `documents` como OBJETO com chave por tipo,
 * mas o template testava Array.isArray() e caía num dump genérico, imprimindo
 * o JSON cru e rótulos em inglês na tela.
 */
function montarComplianceInfo(payload: unknown) {
  const compliance = ref(payload)
  return computed(() => {
    const bruto = (compliance.value ?? {}) as Record<string, unknown>
    const docsBrutos = (bruto.documents ?? {}) as Record<string, Record<string, unknown>>

    const documentos = Object.entries(docsBrutos).map(([chave, doc]) => {
      const status = String(doc.status ?? 'missing')
      const vencido = Boolean(doc.is_expired)
      const rotulo = vencido ? 'Vencido'
        : status === 'valid' || status === 'approved' ? 'Válido'
        : status === 'pending' ? 'Em análise'
        : status === 'rejected' ? 'Rejeitado'
        : 'Não enviado'
      return { chave, label: String(doc.label ?? chave), rotulo }
    })

    return {
      isCompliant: Boolean(bruto.is_compliant),
      documentos,
      enviados: documentos.filter(d => d.rotulo !== 'Não enviado').length,
    }
  }).value
}

// Resposta real da API, capturada de GET /api/vendors/{id}/compliance
const RESPOSTA_REAL = {
  is_compliant: false,
  documents: {
    cnpj_card: { label: 'Cartão CNPJ', status: 'missing', uploaded_at: null, expiry_date: null, is_expired: false },
    alvara: { label: 'Alvará de Funcionamento', status: 'missing', uploaded_at: null, expiry_date: null, is_expired: false },
    social_contract: { label: 'Contrato Social', status: 'missing', uploaded_at: null, expiry_date: null, is_expired: false },
  },
  total_documents: 0,
}

describe('complianceInfo', () => {
  it('extrai os 3 documentos do objeto (não é array)', () => {
    const info = montarComplianceInfo(RESPOSTA_REAL)
    expect(info.documentos).toHaveLength(3)
    expect(info.documentos.map(d => d.label)).toEqual([
      'Cartão CNPJ', 'Alvará de Funcionamento', 'Contrato Social',
    ])
  })

  it('usa os rótulos em português vindos da API', () => {
    const info = montarComplianceInfo(RESPOSTA_REAL)
    // Antes a tela mostrava "IS COMPLIANT" e "TOTAL DOCUMENTS"
    expect(info.documentos.every(d => !/^[A-Z_ ]+$/.test(d.label))).toBe(true)
  })

  it.each([
    ['missing', false, 'Não enviado'],
    ['valid', false, 'Válido'],
    ['approved', false, 'Válido'],
    ['pending', false, 'Em análise'],
    ['rejected', false, 'Rejeitado'],
    ['valid', true, 'Vencido'],
  ])('traduz status "%s" (vencido=%s) para "%s"', (status, vencido, esperado) => {
    const info = montarComplianceInfo({
      is_compliant: false,
      documents: { x: { label: 'Doc', status, is_expired: vencido } },
    })
    expect(info.documentos[0]!.rotulo).toBe(esperado)
  })

  it('vencido tem prioridade sobre o status', () => {
    const info = montarComplianceInfo({
      documents: { x: { label: 'Doc', status: 'approved', is_expired: true } },
    })
    expect(info.documentos[0]!.rotulo).toBe('Vencido')
  })

  it('conta apenas os documentos efetivamente enviados', () => {
    const info = montarComplianceInfo({
      documents: {
        a: { label: 'A', status: 'valid', is_expired: false },
        b: { label: 'B', status: 'missing', is_expired: false },
        c: { label: 'C', status: 'pending', is_expired: false },
      },
    })
    expect(info.enviados).toBe(2)
  })

  it('reflete is_compliant', () => {
    expect(montarComplianceInfo({ is_compliant: true }).isCompliant).toBe(true)
    expect(montarComplianceInfo(RESPOSTA_REAL).isCompliant).toBe(false)
  })

  it('não quebra com payload nulo ou vazio', () => {
    expect(montarComplianceInfo(null).documentos).toEqual([])
    expect(montarComplianceInfo({}).documentos).toEqual([])
    expect(montarComplianceInfo({}).isCompliant).toBe(false)
  })

  it('usa a chave como rótulo quando a API não manda label', () => {
    const info = montarComplianceInfo({ documents: { cnpj_card: { status: 'missing' } } })
    expect(info.documentos[0]!.label).toBe('cnpj_card')
  })
})
