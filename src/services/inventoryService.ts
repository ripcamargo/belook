import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { businessCollection, businessRef, mapOwnedDoc } from '../firebase/firestoreUtils'
import type { InventoryMovement, MovementTargetType, MovementType } from '../types'

export interface CreateMovementInput {
  targetType: MovementTargetType
  targetId: string
  targetName: string
  type: MovementType
  /** sempre um número positivo — o sinal é decidido pelo `type` */
  quantity: number
  unitCost?: number | null
  reason?: string
  supplierName?: string
  note?: string
  userId: string
}

export class InsufficientStockError extends Error {
  constructor(available: number) {
    super(`Estoque insuficiente. Disponível: ${available}.`)
    this.name = 'InsufficientStockError'
  }
}

/**
 * Registra uma movimentação de estoque e atualiza o saldo denormalizado
 * (variant.stock ou component.stock) atomicamente via transação — evita
 * qualquer `quantity++`/`quantity--` "solto" sem rastro (seção 54 do
 * briefing). O saldo é sempre derivado a partir do valor lido dentro da
 * própria transação, então concorrência não causa corrida.
 */
export async function createMovement(businessId: string, input: CreateMovementInput): Promise<void> {
  if (input.quantity <= 0) throw new Error('A quantidade precisa ser maior que zero.')

  const targetCollection = input.targetType === 'variant' ? 'variants' : 'components'
  const targetDocRef = doc(db, 'businesses', businessId, targetCollection, input.targetId)
  const movementRef = doc(collection(db, 'businesses', businessId, 'movements'))
  const businessDocRef = businessRef(businessId)

  const signedQuantity = input.type === 'entrada' ? input.quantity : -input.quantity

  await runTransaction(db, async (transaction) => {
    const [targetSnap, businessSnap] = await Promise.all([
      transaction.get(targetDocRef),
      transaction.get(businessDocRef),
    ])

    if (!targetSnap.exists()) throw new Error('Item não encontrado.')

    const currentStock = (targetSnap.data().stock as number) ?? 0
    const resultingStock = currentStock + signedQuantity
    const allowNegativeStock = businessSnap.exists() ? Boolean(businessSnap.data().allowNegativeStock) : false

    if (resultingStock < 0 && !allowNegativeStock) {
      throw new InsufficientStockError(currentStock)
    }

    const unitCost = input.unitCost ?? null
    const totalCost = unitCost != null ? Math.round(unitCost * input.quantity) : null

    transaction.update(targetDocRef, { stock: resultingStock, updatedAt: serverTimestamp() })
    transaction.set(movementRef, {
      targetType: input.targetType,
      targetId: input.targetId,
      targetName: input.targetName,
      type: input.type,
      quantity: signedQuantity,
      unitCost,
      totalCost,
      reason: input.reason ?? null,
      supplierName: input.supplierName ?? null,
      note: input.note ?? null,
      userId: input.userId,
      resultingStock,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
}

export async function listRecentMovements(businessId: string, count = 20): Promise<InventoryMovement[]> {
  const q = query(businessCollection(businessId, 'movements'), orderBy('createdAt', 'desc'), limit(count))
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapOwnedDoc<InventoryMovement>(d, businessId))
}

export async function listMovementsForTarget(businessId: string, targetId: string): Promise<InventoryMovement[]> {
  const q = query(
    businessCollection(businessId, 'movements'),
    where('targetId', '==', targetId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapOwnedDoc<InventoryMovement>(d, businessId))
}

export async function getMovement(businessId: string, id: string): Promise<InventoryMovement | null> {
  const snap = await getDoc(doc(businessCollection(businessId, 'movements'), id))
  if (!snap.exists()) return null
  return mapOwnedDoc<InventoryMovement>(snap, businessId)
}

/**
 * Exclui uma movimentação manual e reverte o saldo do item afetado. Movimentações
 * geradas automaticamente (venda, produção) não podem ser excluídas por aqui —
 * o estoque só volta ao normal desfazendo o registro de origem (a venda/produção).
 */
export async function deleteMovement(businessId: string, id: string): Promise<void> {
  const movementRef = doc(businessCollection(businessId, 'movements'), id)
  const movementSnap = await getDoc(movementRef)
  if (!movementSnap.exists()) throw new Error('Movimentação não encontrada.')
  const movement = mapOwnedDoc<InventoryMovement>(movementSnap, businessId)

  if (movement.type === 'venda' || movement.type === 'producao') {
    throw new Error('Essa movimentação foi gerada automaticamente e não pode ser excluída diretamente.')
  }

  const targetCollection = movement.targetType === 'variant' ? 'variants' : 'components'
  const targetDocRef = doc(db, 'businesses', businessId, targetCollection, movement.targetId)

  await runTransaction(db, async (transaction) => {
    const targetSnap = await transaction.get(targetDocRef)
    if (targetSnap.exists()) {
      const currentStock = (targetSnap.data().stock as number) ?? 0
      transaction.update(targetDocRef, { stock: currentStock - movement.quantity, updatedAt: serverTimestamp() })
    }
    transaction.delete(movementRef)
  })
}
