import { addDoc, deleteField, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { businessCollection, mapOwnedDoc } from '../firebase/firestoreUtils'
import { sumCents } from '../utils/money'
import type { Order, OrderItem, OrderStatus } from '../types'

export interface OrderInput {
  customerId?: string
  customerName?: string
  items: OrderItem[]
  note?: string
  dueDate?: number | null
}

export async function listOrders(businessId: string): Promise<Order[]> {
  const q = query(businessCollection(businessId, 'orders'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapOwnedDoc<Order>(d, businessId))
}

export async function getOrder(businessId: string, id: string): Promise<Order | null> {
  const snap = await getDoc(doc(businessCollection(businessId, 'orders'), id))
  if (!snap.exists()) return null
  return mapOwnedDoc<Order>(snap, businessId)
}

function totalsFrom(items: OrderItem[]) {
  return {
    totalValue: sumCents(items.map((i) => i.unitPrice * i.quantity)),
    totalCostEstimate: sumCents(items.map((i) => i.unitCostEstimate * i.quantity)),
  }
}

export async function createOrder(businessId: string, input: OrderInput): Promise<string> {
  if (input.items.length === 0) throw new Error('Adicione ao menos um item ao pedido.')
  const ref = await addDoc(businessCollection(businessId, 'orders'), {
    customerId: input.customerId ?? null,
    customerName: input.customerName?.trim() || null,
    status: 'recebido' satisfies OrderStatus,
    items: input.items,
    ...totalsFrom(input.items),
    note: input.note?.trim() || null,
    dueDate: input.dueDate ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateOrder(businessId: string, id: string, input: OrderInput): Promise<void> {
  if (input.items.length === 0) throw new Error('Adicione ao menos um item ao pedido.')
  await updateDoc(doc(businessCollection(businessId, 'orders'), id), {
    customerId: input.customerId ?? null,
    customerName: input.customerName?.trim() || null,
    items: input.items,
    ...totalsFrom(input.items),
    note: input.note?.trim() || deleteField(),
    dueDate: input.dueDate ?? null,
    updatedAt: serverTimestamp(),
  })
}

export async function setOrderStatus(businessId: string, id: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(businessCollection(businessId, 'orders'), id), { status, updatedAt: serverTimestamp() })
}
