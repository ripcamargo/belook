import { addDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { businessCollection, mapOwnedDoc } from '../firebase/firestoreUtils'
import { createMovement } from './inventoryService'
import type { Component } from '../types'

export interface ComponentInput {
  name: string
  category: string | null
  unit: string
  unitCost: number
  minStock: number
  /** quando informado (> 0), gera automaticamente uma movimentação de entrada */
  initialStock?: number
}

export async function listComponents(businessId: string): Promise<Component[]> {
  const snap = await getDocs(businessCollection(businessId, 'components'))
  const components = snap.docs.map((d) => mapOwnedDoc<Component>(d, businessId))
  return components.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function getComponent(businessId: string, id: string): Promise<Component | null> {
  const snap = await getDoc(doc(businessCollection(businessId, 'components'), id))
  if (!snap.exists()) return null
  return mapOwnedDoc<Component>(snap, businessId)
}

export async function createComponent(businessId: string, userId: string, input: ComponentInput): Promise<string> {
  if (!input.name.trim()) throw new Error('Informe o nome do insumo.')

  const ref = await addDoc(businessCollection(businessId, 'components'), {
    name: input.name.trim(),
    category: input.category,
    unit: input.unit,
    unitCost: input.unitCost,
    stock: 0,
    minStock: input.minStock,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  if (input.initialStock && input.initialStock > 0) {
    await createMovement(businessId, {
      targetType: 'component',
      targetId: ref.id,
      targetName: input.name.trim(),
      type: 'entrada',
      quantity: input.initialStock,
      unitCost: input.unitCost,
      reason: 'Estoque inicial',
      userId,
    })
  }

  return ref.id
}

export async function updateComponent(
  businessId: string,
  id: string,
  input: Omit<ComponentInput, 'initialStock'>,
): Promise<void> {
  if (!input.name.trim()) throw new Error('Informe o nome do insumo.')
  await updateDoc(doc(businessCollection(businessId, 'components'), id), {
    name: input.name.trim(),
    category: input.category,
    unit: input.unit,
    unitCost: input.unitCost,
    minStock: input.minStock,
    updatedAt: serverTimestamp(),
  })
}

export async function setComponentActive(businessId: string, id: string, active: boolean): Promise<void> {
  await updateDoc(doc(businessCollection(businessId, 'components'), id), { active, updatedAt: serverTimestamp() })
}
