/** Formata um epoch millis como data curta brasileira. 1735300000000 -> "27/12/2024" */
export function formatDate(millis: number): string {
  return new Date(millis).toLocaleDateString('pt-BR')
}

/** Formata um epoch millis como data e hora brasileira. */
export function formatDateTime(millis: number): string {
  return new Date(millis).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Formata um epoch millis como "27 AGO" (usado no histórico/timeline). */
export function formatDateShort(millis: number): string {
  const formatted = new Date(millis).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
  return formatted.replace('.', '').toUpperCase()
}

/** Formata um número inteiro com separador de milhar brasileiro. 1000 -> "1.000" */
export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

/** Formata uma fração (0-1) como porcentagem brasileira. 0.5409 -> "54,09%" */
export function formatPercent(fraction: number, digits = 2): string {
  return fraction.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}
