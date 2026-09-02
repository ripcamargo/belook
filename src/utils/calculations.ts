import type { Business, Cents, CostComponentLine } from '../types'
import { sumCents } from './money'

interface StockLike {
  stock: number
  minStock: number
}

/** Valor total investido em estoque: soma de (estoque atual × custo unitário). */
export function calculateInventoryValue(items: { stock: number; unitCost: Cents }[]): Cents {
  return sumCents(items.map((item) => item.stock * item.unitCost))
}

/** Itens cujo estoque atual está abaixo do mínimo configurado. */
export function filterLowStock<T extends StockLike>(items: T[]): T[] {
  return items.filter((item) => item.stock < item.minStock)
}

/** Soma dos insumos da ficha de custo (ex.: DTF + embalagem + etiqueta). */
export function calculateCompositionCost(composition: CostComponentLine[]): Cents {
  return sumCents(composition.map((line) => line.quantity * line.unitCost))
}

/** Custo de mão de obra: tempo de produção × valor da hora de trabalho configurado no negócio. */
export function calculateLaborCost(laborMinutes: number, laborRatePerHour: Cents): Cents {
  return Math.round((laborMinutes / 60) * laborRatePerHour)
}

/** Rateio do custo fixo mensal (energia, aluguel, depreciação de equipamento) por unidade produzida. */
export function calculateOverheadPerUnit(business: Pick<Business, 'monthlyOverhead' | 'estimatedMonthlyProduction'>): Cents {
  if (!business.estimatedMonthlyProduction || business.estimatedMonthlyProduction <= 0) return 0
  return Math.round(business.monthlyOverhead / business.estimatedMonthlyProduction)
}

export interface UnitCostBreakdown {
  materialCost: Cents
  compositionCost: Cents
  laborCost: Cents
  overheadCost: Cents
  total: Cents
}

/**
 * Custo completo de uma variante: peça base + insumos da ficha de custo +
 * mão de obra (tempo do produto × valor/hora do negócio) + rateio do custo
 * fixo mensal. Mão de obra e rateio são iguais para todas as variantes do
 * mesmo produto — só o custo da peça em si varia por variante.
 */
export function calculateFullUnitCost(
  variant: { baseCost: Cents },
  product: { composition: CostComponentLine[]; laborMinutes: number },
  business: Pick<Business, 'laborRatePerHour' | 'monthlyOverhead' | 'estimatedMonthlyProduction'>,
): UnitCostBreakdown {
  const compositionCost = calculateCompositionCost(product.composition ?? [])
  const laborCost = calculateLaborCost(product.laborMinutes ?? 0, business.laborRatePerHour ?? 0)
  const overheadCost = calculateOverheadPerUnit(business)
  return {
    materialCost: variant.baseCost,
    compositionCost,
    laborCost,
    overheadCost,
    total: variant.baseCost + compositionCost + laborCost + overheadCost,
  }
}

/** Margem de lucro como fração (0-1) sobre o preço de venda. Sem preço definido, retorna null. */
export function calculateMargin(sellingPrice: Cents | null, unitCost: Cents): number | null {
  if (!sellingPrice || sellingPrice <= 0) return null
  return (sellingPrice - unitCost) / sellingPrice
}

/**
 * Sugere um preço de venda a partir do custo, da margem de lucro desejada e
 * da taxa de pagamento/marketplace (ambas frações 0-1) — garante que, depois
 * de descontada a taxa, sobre exatamente a margem pedida. Retorna null se a
 * margem + taxa somarem 100% ou mais (preço infinito).
 */
export function suggestSellingPrice(unitCost: Cents, targetMargin: number, paymentFeePercent: number): Cents | null {
  const denominator = 1 - targetMargin - paymentFeePercent
  if (denominator <= 0) return null
  return Math.round(unitCost / denominator)
}
