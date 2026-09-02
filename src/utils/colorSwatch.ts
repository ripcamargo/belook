/** Mapa de nomes de cor (PT-BR) para um hex aproximado, usado só para exibir uma bolinha visual. */
const COLOR_HEX: Record<string, string> = {
  branco: '#ffffff',
  preto: '#111111',
  cinza: '#9ca3af',
  chumbo: '#4b5563',
  azul: '#2563eb',
  'azul marinho': '#1e3a8a',
  'azul royal': '#1d4ed8',
  vermelho: '#dc2626',
  verde: '#16a34a',
  'verde militar': '#4d7c0f',
  amarelo: '#eab308',
  rosa: '#ec4899',
  roxo: '#9333ea',
  lilás: '#c084fc',
  marrom: '#78350f',
  bege: '#e7d7b7',
  laranja: '#f97316',
  vinho: '#7f1d1d',
  dourado: '#ca8a04',
  prata: '#c0c0c0',
}

/** Retorna um hex aproximado para a cor informada, ou null se não reconhecida. */
export function getColorHex(colorName: string): string | null {
  return COLOR_HEX[colorName.trim().toLowerCase()] ?? null
}
