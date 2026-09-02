import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { businessRef } from '../firebase/firestoreUtils'
import { InsufficientStockError } from './inventoryService'
import { sumCents } from '../utils/money'
import type { CostComponentLine } from '../types'

export interface ProduceInput {
  variantId: string
  productName: string
  color: string
  size: string
  quantity: number
  variantBaseCost: number
  /** ficha de custo do produto — apenas linhas do tipo 'component' são consumidas do estoque de insumos */
  composition: CostComponentLine[]
  /** mão de obra (tempo × valor/hora) e rateio de custo fixo já calculados — não consomem estoque, só compõem o custo unitário registrado */
  laborCost: number
  overheadCost: number
  userId: string
}

/**
 * "Fabrica" unidades de uma variante: dá entrada no estoque da peça pronta e,
 * na mesma transação, dá baixa nos insumos da ficha de custo proporcional à
 * quantidade produzida. Segue o mesmo padrão de createSale (várias leituras
 * antes de qualquer escrita, saldo sempre derivado dentro da transação).
 */
export async function produceVariant(businessId: string, input: ProduceInput): Promise<void> {
  if (input.quantity <= 0) throw new Error('A quantidade precisa ser maior que zero.')

  const variantRef = doc(db, 'businesses', businessId, 'variants', input.variantId)
  const variantMovementRef = doc(collection(db, 'businesses', businessId, 'movements'))
  const businessDocRef = businessRef(businessId)

  const componentLines = input.composition.filter((l) => l.refType === 'component')
  const componentRefs = componentLines.map((l) => doc(db, 'businesses', businessId, 'components', l.refId))
  const componentMovementRefs = componentLines.map(() => doc(collection(db, 'businesses', businessId, 'movements')))

  const unitCost =
    input.variantBaseCost +
    sumCents(componentLines.map((l) => l.quantity * l.unitCost)) +
    input.laborCost +
    input.overheadCost

  await runTransaction(db, async (transaction) => {
    const [variantSnap, businessSnap, ...componentSnaps] = await Promise.all([
      transaction.get(variantRef),
      transaction.get(businessDocRef),
      ...componentRefs.map((ref) => transaction.get(ref)),
    ])

    if (!variantSnap.exists()) throw new Error('Variante não encontrada.')
    const allowNegativeStock = businessSnap.exists() ? Boolean(businessSnap.data().allowNegativeStock) : false

    const currentVariantStock = (variantSnap.data().stock as number) ?? 0
    const resultingVariantStock = currentVariantStock + input.quantity

    transaction.update(variantRef, { stock: resultingVariantStock, updatedAt: serverTimestamp() })
    transaction.set(variantMovementRef, {
      targetType: 'variant',
      targetId: input.variantId,
      targetName: `${input.productName} — ${input.color} / ${input.size}`,
      type: 'producao',
      quantity: input.quantity,
      unitCost,
      totalCost: Math.round(unitCost * input.quantity),
      reason: null,
      supplierName: null,
      note: null,
      userId: input.userId,
      resultingStock: resultingVariantStock,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    componentLines.forEach((line, index) => {
      const snap = componentSnaps[index]
      if (!snap.exists()) throw new Error(`Insumo "${line.name}" não encontrado.`)

      const requiredQty = line.quantity * input.quantity
      const currentStock = (snap.data().stock as number) ?? 0
      const resultingStock = currentStock - requiredQty
      if (resultingStock < 0 && !allowNegativeStock) throw new InsufficientStockError(currentStock)

      transaction.update(componentRefs[index], { stock: resultingStock, updatedAt: serverTimestamp() })
      transaction.set(componentMovementRefs[index], {
        targetType: 'component',
        targetId: line.refId,
        targetName: line.name,
        type: 'producao',
        quantity: -requiredQty,
        unitCost: line.unitCost,
        totalCost: Math.round(line.unitCost * requiredQty),
        reason: null,
        supplierName: null,
        note: `Consumo para produção de ${input.quantity}x ${input.productName} — ${input.color}/${input.size}`,
        userId: input.userId,
        resultingStock,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
  })
}
