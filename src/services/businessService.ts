import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { toMillis } from '../firebase/firestoreUtils'
import type { Business } from '../types'

/**
 * Garante que o documento businesses/{uid} exista. É chamado uma vez após
 * o login — como cada usuário é dono do seu próprio negócio hoje,
 * businessId == uid (ver comentário em firestore.rules).
 */
export async function ensureBusinessDoc(uid: string, email: string | null): Promise<void> {
  const ref = doc(db, 'businesses', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return

  const defaultName = email ? email.split('@')[0] : 'Minha marca'

  await setDoc(ref, {
    name: defaultName,
    currency: 'BRL',
    allowNegativeStock: false,
    defaultMinStock: 5,
    theme: 'system',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getBusiness(businessId: string): Promise<Business | null> {
  const snap = await getDoc(doc(db, 'businesses', businessId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    ...data,
    id: snap.id,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  } as Business
}

export async function updateBusinessName(businessId: string, name: string): Promise<void> {
  if (!name.trim()) throw new Error('Informe o nome da empresa.')
  await updateDoc(doc(db, 'businesses', businessId), { name: name.trim(), updatedAt: serverTimestamp() })
}
