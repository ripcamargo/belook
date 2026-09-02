import { addDoc, deleteField, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { businessCollection, mapOwnedDoc } from '../firebase/firestoreUtils'
import type { Supplier } from '../types'

export interface SupplierInput {
  name: string
  contact?: string
  note?: string
}

export async function listSuppliers(businessId: string): Promise<Supplier[]> {
  const snap = await getDocs(businessCollection(businessId, 'suppliers'))
  const suppliers = snap.docs.map((d) => mapOwnedDoc<Supplier>(d, businessId))
  return suppliers.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function getSupplier(businessId: string, id: string): Promise<Supplier | null> {
  const snap = await getDoc(doc(businessCollection(businessId, 'suppliers'), id))
  if (!snap.exists()) return null
  return mapOwnedDoc<Supplier>(snap, businessId)
}

export async function createSupplier(businessId: string, input: SupplierInput): Promise<string> {
  if (!input.name.trim()) throw new Error('Informe o nome do fornecedor.')
  const ref = await addDoc(businessCollection(businessId, 'suppliers'), {
    name: input.name.trim(),
    contact: input.contact?.trim() || null,
    note: input.note?.trim() || null,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateSupplier(businessId: string, id: string, input: SupplierInput): Promise<void> {
  if (!input.name.trim()) throw new Error('Informe o nome do fornecedor.')
  await updateDoc(doc(businessCollection(businessId, 'suppliers'), id), {
    name: input.name.trim(),
    contact: input.contact?.trim() || deleteField(),
    note: input.note?.trim() || deleteField(),
    updatedAt: serverTimestamp(),
  })
}

export async function setSupplierActive(businessId: string, id: string, active: boolean): Promise<void> {
  await updateDoc(doc(businessCollection(businessId, 'suppliers'), id), { active, updatedAt: serverTimestamp() })
}
