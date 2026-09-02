import { addDoc, deleteDoc, deleteField, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { businessCollection, mapOwnedDoc } from '../firebase/firestoreUtils'
import type { Expense, ExpenseCategory } from '../types'

export interface ExpenseInput {
  description: string
  category: ExpenseCategory
  amount: number
  date: number
  note?: string
}

export async function listExpenses(businessId: string): Promise<Expense[]> {
  const q = query(businessCollection(businessId, 'expenses'), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapOwnedDoc<Expense>(d, businessId))
}

export async function getExpense(businessId: string, id: string): Promise<Expense | null> {
  const snap = await getDoc(doc(businessCollection(businessId, 'expenses'), id))
  if (!snap.exists()) return null
  return mapOwnedDoc<Expense>(snap, businessId)
}

export async function createExpense(businessId: string, input: ExpenseInput): Promise<string> {
  if (!input.description.trim()) throw new Error('Informe a descrição da despesa.')
  if (input.amount <= 0) throw new Error('Informe um valor maior que zero.')
  const ref = await addDoc(businessCollection(businessId, 'expenses'), {
    description: input.description.trim(),
    category: input.category,
    amount: input.amount,
    date: input.date,
    note: input.note?.trim() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateExpense(businessId: string, id: string, input: ExpenseInput): Promise<void> {
  if (!input.description.trim()) throw new Error('Informe a descrição da despesa.')
  if (input.amount <= 0) throw new Error('Informe um valor maior que zero.')
  await updateDoc(doc(businessCollection(businessId, 'expenses'), id), {
    description: input.description.trim(),
    category: input.category,
    amount: input.amount,
    date: input.date,
    note: input.note?.trim() || deleteField(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteExpense(businessId: string, id: string): Promise<void> {
  await deleteDoc(doc(businessCollection(businessId, 'expenses'), id))
}
