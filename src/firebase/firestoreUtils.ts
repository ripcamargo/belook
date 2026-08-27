import { collection, doc, Timestamp, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from './config'

/** Referência a uma subcoleção dentro do negócio do usuário (businesses/{businessId}/{path}). */
export function businessCollection(businessId: string, path: string) {
  return collection(db, 'businesses', businessId, path)
}

export function businessDoc(businessId: string, path: string, id: string) {
  return doc(db, 'businesses', businessId, path, id)
}

export function businessRef(businessId: string) {
  return doc(db, 'businesses', businessId)
}

/** Converte um Timestamp do Firestore (ou já-number) para epoch millis. */
export function toMillis(value: Timestamp | number | undefined | null): number {
  if (value == null) return Date.now()
  if (typeof value === 'number') return value
  return value.toMillis()
}

/** Extrai { id, businessId, ...data } de um snapshot, pronto para uso na UI. */
export function mapOwnedDoc<T>(snap: QueryDocumentSnapshot<DocumentData>, businessId: string): T {
  const data = snap.data()
  return {
    ...data,
    id: snap.id,
    businessId,
    createdAt: toMillis(data.createdAt as Timestamp | undefined),
    updatedAt: toMillis(data.updatedAt as Timestamp | undefined),
  } as unknown as T
}
