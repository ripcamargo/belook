import type { Cents } from '../types'

/** Formata centavos como moeda brasileira. 5990 -> "R$ 59,90" */
export function formatMoney(cents: Cents): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** Converte um valor digitado em reais (string, aceita vírgula) para centavos. */
export function parseMoneyToCents(value: string): number {
  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  if (Number.isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

/** Soma valores em centavos com segurança (evita acumular float error). */
export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((acc, v) => acc + Math.round(v), 0)
}

export function centsToReais(cents: Cents): number {
  return cents / 100
}

export function reaisToCents(reais: number): Cents {
  return Math.round(reais * 100)
}
