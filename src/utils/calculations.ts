import type { Cents } from '../types'
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
