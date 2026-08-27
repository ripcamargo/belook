import type { MovementType } from '../types'

/** Sugestões de categoria — o campo continua sendo texto livre. */
export const PRODUCT_CATEGORY_SUGGESTIONS = ['Camisetas', 'Moletons', 'Bonés', 'Outros']
export const COMPONENT_CATEGORY_SUGGESTIONS = ['Estampas', 'Insumos', 'Embalagens', 'Outros']

export const UNIT_SUGGESTIONS = ['unidade', 'metro', 'litro', 'kg', 'par', 'folha']

export const SIZE_SUGGESTIONS = ['PP', 'P', 'M', 'G', 'GG', 'XG']

/** Motivos de saída manual. "Venda" não está aqui de propósito: vendas
 *  passam pelo fluxo de Vendas (Etapa 3), que já calcula receita/lucro e
 *  gera sua própria movimentação de estoque do tipo "venda" — evitar dar
 *  baixa duas vezes no mesmo item. */
export const OUTBOUND_REASONS: { value: MovementType; label: string }[] = [
  { value: 'uso_proprio', label: 'Uso próprio' },
  { value: 'brinde', label: 'Brinde' },
  { value: 'perda', label: 'Perda' },
  { value: 'ajuste', label: 'Ajuste' },
]

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  perda: 'Perda',
  brinde: 'Brinde',
  uso_proprio: 'Uso próprio',
  venda: 'Venda',
  producao: 'Produção',
}
