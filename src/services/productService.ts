import { addDoc, deleteField, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { businessCollection, mapOwnedDoc } from '../firebase/firestoreUtils'
import { createMovement } from './inventoryService'
import type { CostComponentLine, Product, ProductVariant } from '../types'

export interface ProductInput {
  name: string
  category: string | null
  description?: string
  sellingPrice: number | null
}

export interface VariantInput {
  color: string
  size: string
  sku?: string
  baseCost: number
  minStock: number
  /** quando informado (> 0), gera automaticamente uma movimentação de entrada */
  initialStock?: number
}

// Produtos ---------------------------------------------------------------

export async function listProducts(businessId: string): Promise<Product[]> {
  const snap = await getDocs(businessCollection(businessId, 'products'))
  const products = snap.docs.map((d) => mapOwnedDoc<Product>(d, businessId))
  return products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function getProduct(businessId: string, id: string): Promise<Product | null> {
  const snap = await getDoc(doc(businessCollection(businessId, 'products'), id))
  if (!snap.exists()) return null
  return mapOwnedDoc<Product>(snap, businessId)
}

export async function createProduct(businessId: string, input: ProductInput): Promise<string> {
  if (!input.name.trim()) throw new Error('Informe o nome do produto.')
  const ref = await addDoc(businessCollection(businessId, 'products'), {
    name: input.name.trim(),
    category: input.category,
    description: input.description?.trim() || null,
    composition: [],
    laborMinutes: 0,
    sellingPrice: input.sellingPrice,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateProduct(businessId: string, id: string, input: ProductInput): Promise<void> {
  if (!input.name.trim()) throw new Error('Informe o nome do produto.')
  await updateDoc(doc(businessCollection(businessId, 'products'), id), {
    name: input.name.trim(),
    category: input.category,
    description: input.description?.trim() || deleteField(),
    sellingPrice: input.sellingPrice,
    updatedAt: serverTimestamp(),
  })
}

export async function setProductActive(businessId: string, id: string, active: boolean): Promise<void> {
  await updateDoc(doc(businessCollection(businessId, 'products'), id), { active, updatedAt: serverTimestamp() })
}

export async function updateComposition(businessId: string, id: string, composition: CostComponentLine[]): Promise<void> {
  await updateDoc(doc(businessCollection(businessId, 'products'), id), { composition, updatedAt: serverTimestamp() })
}

export async function updateLaborMinutes(businessId: string, id: string, laborMinutes: number): Promise<void> {
  await updateDoc(doc(businessCollection(businessId, 'products'), id), { laborMinutes, updatedAt: serverTimestamp() })
}

export async function updateSellingPrice(businessId: string, id: string, sellingPrice: number): Promise<void> {
  await updateDoc(doc(businessCollection(businessId, 'products'), id), { sellingPrice, updatedAt: serverTimestamp() })
}

// Variantes ----------------------------------------------------------------

export async function listAllVariants(businessId: string): Promise<ProductVariant[]> {
  const snap = await getDocs(businessCollection(businessId, 'variants'))
  return snap.docs.map((d) => mapOwnedDoc<ProductVariant>(d, businessId))
}

export async function listVariantsByProduct(businessId: string, productId: string): Promise<ProductVariant[]> {
  const all = await listAllVariants(businessId)
  return all.filter((v) => v.productId === productId)
}

export async function createVariant(
  businessId: string,
  productId: string,
  productName: string,
  userId: string,
  input: VariantInput,
): Promise<string> {
  if (!input.color.trim() || !input.size.trim()) throw new Error('Informe cor e tamanho da variante.')

  const ref = await addDoc(businessCollection(businessId, 'variants'), {
    productId,
    sku: input.sku?.trim() || null,
    color: input.color.trim(),
    size: input.size.trim(),
    stock: 0,
    minStock: input.minStock,
    baseCost: input.baseCost,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  if (input.initialStock && input.initialStock > 0) {
    await createMovement(businessId, {
      targetType: 'variant',
      targetId: ref.id,
      targetName: `${productName} — ${input.color} / ${input.size}`,
      type: 'entrada',
      quantity: input.initialStock,
      unitCost: input.baseCost,
      reason: 'Estoque inicial',
      userId,
    })
  }

  return ref.id
}

export async function updateVariant(
  businessId: string,
  id: string,
  input: Omit<VariantInput, 'initialStock'>,
): Promise<void> {
  if (!input.color.trim() || !input.size.trim()) throw new Error('Informe cor e tamanho da variante.')
  await updateDoc(doc(businessCollection(businessId, 'variants'), id), {
    sku: input.sku?.trim() || null,
    color: input.color.trim(),
    size: input.size.trim(),
    minStock: input.minStock,
    baseCost: input.baseCost,
    updatedAt: serverTimestamp(),
  })
}

export async function setVariantActive(businessId: string, id: string, active: boolean): Promise<void> {
  await updateDoc(doc(businessCollection(businessId, 'variants'), id), { active, updatedAt: serverTimestamp() })
}
