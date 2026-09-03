import { collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { businessCollection, businessRef, mapOwnedDoc } from '../firebase/firestoreUtils'
import { InsufficientStockError } from './inventoryService'
import { sumCents } from '../utils/money'
import type { Sale, SaleItem } from '../types'

export interface SaleItemInput {
  variantId: string
  productName: string
  color: string
  size: string
  quantity: number
  unitPrice: number
  unitCost: number
}

export interface CreateSaleInput {
  customerId?: string
  customerName?: string
  items: SaleItemInput[]
  note?: string
  userId: string
}

/**
 * Registra uma venda e dá baixa no estoque de cada variante envolvida em uma
 * única transação (mesmo padrão de createMovement em inventoryService, mas
 * abrangendo vários itens de uma vez): todas as leituras de estoque acontecem
 * antes de qualquer escrita, e o saldo resultante é sempre derivado do valor
 * lido dentro da própria transação.
 */
export async function createSale(businessId: string, input: CreateSaleInput): Promise<string> {
  if (input.items.length === 0) throw new Error('Adicione ao menos um item à venda.')

  const saleRef = doc(businessCollection(businessId, 'sales'))
  const businessDocRef = businessRef(businessId)
  const variantRefs = input.items.map((item) => doc(db, 'businesses', businessId, 'variants', item.variantId))
  const movementRefs = input.items.map(() => doc(collection(db, 'businesses', businessId, 'movements')))

  await runTransaction(db, async (transaction) => {
    const [businessSnap, ...variantSnaps] = await Promise.all([
      transaction.get(businessDocRef),
      ...variantRefs.map((ref) => transaction.get(ref)),
    ])

    const allowNegativeStock = businessSnap.exists() ? Boolean(businessSnap.data().allowNegativeStock) : false

    const items: SaleItem[] = input.items.map((item, index) => {
      const variantSnap = variantSnaps[index]
      if (!variantSnap.exists()) throw new Error(`Variante de "${item.productName}" não encontrada.`)

      const currentStock = (variantSnap.data().stock as number) ?? 0
      const resultingStock = currentStock - item.quantity
      if (resultingStock < 0 && !allowNegativeStock) throw new InsufficientStockError(currentStock)

      transaction.update(variantRefs[index], { stock: resultingStock, updatedAt: serverTimestamp() })
      transaction.set(movementRefs[index], {
        targetType: 'variant',
        targetId: item.variantId,
        targetName: `${item.productName} — ${item.color} / ${item.size}`,
        type: 'venda',
        quantity: -item.quantity,
        unitCost: item.unitCost,
        totalCost: Math.round(item.unitCost * item.quantity),
        reason: null,
        supplierName: null,
        note: null,
        userId: input.userId,
        resultingStock,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return {
        variantId: item.variantId,
        productName: item.productName,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
      }
    })

    const totalRevenue = sumCents(items.map((i) => i.unitPrice * i.quantity))
    const totalCost = sumCents(items.map((i) => i.unitCost * i.quantity))

    transaction.set(saleRef, {
      customerId: input.customerId ?? null,
      customerName: input.customerName?.trim() || null,
      items,
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      note: input.note?.trim() || null,
      soldAt: Date.now(),
      userId: input.userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  return saleRef.id
}

export async function listRecentSales(businessId: string, count = 50): Promise<Sale[]> {
  const q = query(businessCollection(businessId, 'sales'), orderBy('createdAt', 'desc'), limit(count))
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapOwnedDoc<Sale>(d, businessId))
}

export async function getSale(businessId: string, id: string): Promise<Sale | null> {
  const snap = await getDoc(doc(businessCollection(businessId, 'sales'), id))
  if (!snap.exists()) return null
  return mapOwnedDoc<Sale>(snap, businessId)
}

/**
 * Exclui uma venda e devolve a quantidade de cada item ao estoque da variante
 * correspondente, na mesma transação — o inverso de createSale. Se a variante
 * já não existir mais, o item é ignorado (nada a devolver).
 */
export async function deleteSale(businessId: string, id: string): Promise<void> {
  const saleRef = doc(businessCollection(businessId, 'sales'), id)
  const saleSnap = await getDoc(saleRef)
  if (!saleSnap.exists()) throw new Error('Venda não encontrada.')
  const sale = mapOwnedDoc<Sale>(saleSnap, businessId)

  const variantRefs = sale.items.map((item) => doc(db, 'businesses', businessId, 'variants', item.variantId))

  await runTransaction(db, async (transaction) => {
    const variantSnaps = await Promise.all(variantRefs.map((ref) => transaction.get(ref)))
    variantSnaps.forEach((variantSnap, index) => {
      if (!variantSnap.exists()) return
      const currentStock = (variantSnap.data().stock as number) ?? 0
      transaction.update(variantRefs[index], {
        stock: currentStock + sale.items[index].quantity,
        updatedAt: serverTimestamp(),
      })
    })
    transaction.delete(saleRef)
  })
}
