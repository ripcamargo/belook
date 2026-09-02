import { addDoc, deleteField, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { businessCollection, mapOwnedDoc } from '../firebase/firestoreUtils'
import type { Customer } from '../types'

export interface CustomerInput {
  name: string
  phone?: string
  email?: string
  note?: string
}

export async function listCustomers(businessId: string): Promise<Customer[]> {
  const snap = await getDocs(businessCollection(businessId, 'customers'))
  const customers = snap.docs.map((d) => mapOwnedDoc<Customer>(d, businessId))
  return customers.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function getCustomer(businessId: string, id: string): Promise<Customer | null> {
  const snap = await getDoc(doc(businessCollection(businessId, 'customers'), id))
  if (!snap.exists()) return null
  return mapOwnedDoc<Customer>(snap, businessId)
}

export async function createCustomer(businessId: string, input: CustomerInput): Promise<string> {
  if (!input.name.trim()) throw new Error('Informe o nome do cliente.')
  const ref = await addDoc(businessCollection(businessId, 'customers'), {
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    note: input.note?.trim() || null,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateCustomer(businessId: string, id: string, input: CustomerInput): Promise<void> {
  if (!input.name.trim()) throw new Error('Informe o nome do cliente.')
  await updateDoc(doc(businessCollection(businessId, 'customers'), id), {
    name: input.name.trim(),
    phone: input.phone?.trim() || deleteField(),
    email: input.email?.trim() || deleteField(),
    note: input.note?.trim() || deleteField(),
    updatedAt: serverTimestamp(),
  })
}

export async function setCustomerActive(businessId: string, id: string, active: boolean): Promise<void> {
  await updateDoc(doc(businessCollection(businessId, 'customers'), id), { active, updatedAt: serverTimestamp() })
}
