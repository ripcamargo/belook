import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { QuantityInput } from '../components/QuantityInput'
import { MoneyInput } from '../components/MoneyInput'
import { useAuth } from '../hooks/useAuth'
import { listAllVariants, listProducts } from '../services/productService'
import { listComponents } from '../services/componentService'
import { createMovement, InsufficientStockError } from '../services/inventoryService'
import type { Component, MovementType, Product, ProductVariant } from '../types'
import { OUTBOUND_REASONS } from '../utils/constants'
import { formatMoney } from '../utils/money'

type Direction = 'entrada' | 'saida'
type TargetKind = 'produto' | 'insumo'

export function MovementFormPage() {
  const [searchParams] = useSearchParams()
  const { businessId, user } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)

  const [direction, setDirection] = useState<Direction>(searchParams.get('type') === 'saida' ? 'saida' : 'entrada')
  const [targetKind, setTargetKind] = useState<TargetKind>('produto')
  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [componentId, setComponentId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitCost, setUnitCost] = useState(0)
  const [supplierName, setSupplierName] = useState('')
  const [outboundReason, setOutboundReason] = useState<MovementType>('uso_proprio')
  const [note, setNote] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!businessId) return
    Promise.all([listProducts(businessId), listAllVariants(businessId), listComponents(businessId)]).then(
      ([p, v, c]) => {
        setProducts(p.filter((x) => x.active))
        setVariants(v.filter((x) => x.active))
        setComponents(c.filter((x) => x.active))
        setLoading(false)
      },
    )
  }, [businessId])

  const productVariants = useMemo(() => variants.filter((v) => v.productId === productId), [variants, productId])

  useEffect(() => {
    if (productVariants.length > 0 && !productVariants.some((v) => v.id === variantId)) {
      setVariantId(productVariants[0].id)
    }
  }, [productVariants, variantId])

  const selectedVariant = variants.find((v) => v.id === variantId) ?? null
  const selectedComponent = components.find((c) => c.id === componentId) ?? null

  useEffect(() => {
    if (direction !== 'entrada') return
    if (targetKind === 'produto' && selectedVariant) setUnitCost(selectedVariant.baseCost)
    if (targetKind === 'insumo' && selectedComponent) setUnitCost(selectedComponent.unitCost)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant?.id, selectedComponent?.id, direction])

  if (loading) return <LoadingScreen />

  const hasNoItems = products.length === 0 && components.length === 0

  async function handleSubmit() {
    if (!businessId || !user) return
    setError(null)

    const isProduto = targetKind === 'produto'
    const target = isProduto ? selectedVariant : selectedComponent
    if (!target) {
      setError(isProduto ? 'Selecione um produto e uma variante.' : 'Selecione um insumo.')
      return
    }

    const product = isProduto ? products.find((p) => p.id === productId) : null
    const targetName = isProduto && selectedVariant ? `${product?.name ?? ''} — ${selectedVariant.color}/${selectedVariant.size}` : selectedComponent?.name ?? ''

    setSaving(true)
    try {
      await createMovement(businessId, {
        targetType: isProduto ? 'variant' : 'component',
        targetId: target.id,
        targetName,
        type: direction === 'entrada' ? 'entrada' : outboundReason,
        quantity,
        unitCost: direction === 'entrada' ? unitCost : null,
        supplierName: direction === 'entrada' ? supplierName.trim() || undefined : undefined,
        note: note.trim() || undefined,
        userId: user.uid,
      })

      if (direction === 'entrada') {
        setSuccess(`+${quantity} unidades registradas. Valor investido: ${formatMoney(unitCost * quantity)}.`)
      } else {
        setSuccess(`-${quantity} unidades registradas.`)
      }

      // Mantém produto/variante selecionados para agilizar o próximo lançamento (seção 56).
      setQuantity(1)
      setNote('')

      const freshVariants = isProduto ? await listAllVariants(businessId) : variants
      const freshComponents = !isProduto ? await listComponents(businessId) : components
      setVariants(freshVariants.filter((v) => v.active))
      setComponents(freshComponents.filter((c) => c.active))
    } catch (err) {
      setError(
        err instanceof InsufficientStockError || err instanceof Error
          ? err.message
          : 'Não foi possível registrar a movimentação.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bl-page">
      <PageHeader title="Movimentar estoque" back />

      {hasNoItems ? (
        <div className="bl-card p-4 text-center small text-muted-bl">
          Cadastre um produto ou insumo antes de registrar movimentações.
        </div>
      ) : (
        <div className="bl-card p-4 d-flex flex-column gap-3">
          {error && (
            <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-success-light)', color: 'var(--bl-success)' }}>
              {success}
            </div>
          )}

          <div className="btn-group" role="group">
            <button
              type="button"
              className="btn fw-semibold"
              style={{
                background: direction === 'entrada' ? 'var(--bl-success)' : 'var(--bl-surface-2)',
                color: direction === 'entrada' ? '#fff' : 'var(--bl-text)',
              }}
              onClick={() => setDirection('entrada')}
            >
              <i className="bi bi-box-arrow-in-down me-1" />
              Entrada
            </button>
            <button
              type="button"
              className="btn fw-semibold"
              style={{
                background: direction === 'saida' ? 'var(--bl-danger)' : 'var(--bl-surface-2)',
                color: direction === 'saida' ? '#fff' : 'var(--bl-text)',
              }}
              onClick={() => setDirection('saida')}
            >
              <i className="bi bi-box-arrow-up me-1" />
              Saída
            </button>
          </div>

          <div className="btn-group" role="group">
            <button
              type="button"
              className="btn btn-sm fw-semibold"
              style={{
                background: targetKind === 'produto' ? 'var(--bl-primary-light)' : 'transparent',
                color: targetKind === 'produto' ? 'var(--bl-primary)' : 'var(--bl-text-muted)',
                border: '1px solid var(--bl-border)',
              }}
              onClick={() => setTargetKind('produto')}
            >
              Produto
            </button>
            <button
              type="button"
              className="btn btn-sm fw-semibold"
              style={{
                background: targetKind === 'insumo' ? 'var(--bl-primary-light)' : 'transparent',
                color: targetKind === 'insumo' ? 'var(--bl-primary)' : 'var(--bl-text-muted)',
                border: '1px solid var(--bl-border)',
              }}
              onClick={() => setTargetKind('insumo')}
            >
              Insumo
            </button>
          </div>

          {targetKind === 'produto' ? (
            <>
              <div>
                <label className="form-label small fw-semibold">Produto</label>
                <select className="form-select" value={productId} onChange={(e) => setProductId(e.target.value)}>
                  <option value="" disabled>
                    Selecione
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label small fw-semibold">Variante</label>
                <select
                  className="form-select"
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                  disabled={productVariants.length === 0}
                >
                  {productVariants.length === 0 && <option>Nenhuma variante</option>}
                  {productVariants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.color} / {v.size} — estoque {v.stock}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="form-label small fw-semibold">Insumo</label>
              <select className="form-select" value={componentId} onChange={(e) => setComponentId(e.target.value)}>
                <option value="" disabled>
                  Selecione
                </option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — estoque {c.stock}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label small fw-semibold">Quantidade</label>
            <QuantityInput value={quantity} onChange={setQuantity} />
          </div>

          {direction === 'entrada' ? (
            <>
              <div>
                <label className="form-label small fw-semibold">Custo unitário</label>
                <MoneyInput value={unitCost} onChange={setUnitCost} />
              </div>
              <div>
                <label className="form-label small fw-semibold">Fornecedor (opcional)</label>
                <input type="text" className="form-control" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
              </div>
            </>
          ) : (
            <div>
              <label className="form-label small fw-semibold">Motivo</label>
              <select className="form-select" value={outboundReason} onChange={(e) => setOutboundReason(e.target.value as MovementType)}>
                {OUTBOUND_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label small fw-semibold">Observação (opcional)</label>
            <input type="text" className="form-control" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <button
            type="button"
            className="btn btn-lg fw-semibold text-white"
            style={{ background: direction === 'entrada' ? 'var(--bl-success)' : 'var(--bl-danger)' }}
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? 'Salvando…' : direction === 'entrada' ? 'Adicionar entrada' : 'Registrar saída'}
          </button>
        </div>
      )}
    </div>
  )
}
