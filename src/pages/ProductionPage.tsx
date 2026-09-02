import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { ColorDot } from '../components/ColorDot'
import { QuantityInput } from '../components/QuantityInput'
import { useAuth } from '../hooks/useAuth'
import { listAllVariants, listProducts } from '../services/productService'
import { listComponents } from '../services/componentService'
import { produceVariant } from '../services/productionService'
import { InsufficientStockError } from '../services/inventoryService'
import { getBusiness } from '../services/businessService'
import type { Business, Component, Product, ProductVariant } from '../types'
import { calculateFullUnitCost } from '../utils/calculations'
import { formatMoney } from '../utils/money'

export function ProductionPage() {
  const { businessId, user } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!businessId) return
    Promise.all([listProducts(businessId), listAllVariants(businessId), listComponents(businessId), getBusiness(businessId)]).then(
      ([p, v, c, b]) => {
        setProducts(p.filter((x) => x.active))
        setVariants(v.filter((x) => x.active))
        setComponents(c.filter((x) => x.active))
        setBusiness(b)
        setLoading(false)
      },
    )
  }, [businessId])

  const productVariants = useMemo(() => variants.filter((v) => v.productId === productId), [variants, productId])

  useEffect(() => {
    if (productVariants.length > 0 && !productVariants.some((v) => v.id === variantId)) {
      setVariantId(productVariants[0].id)
    } else if (productVariants.length === 0) {
      setVariantId('')
    }
  }, [productVariants, variantId])

  if (loading || !business) return <LoadingScreen />

  const selectedProduct = products.find((p) => p.id === productId) ?? null
  const selectedVariant = variants.find((v) => v.id === variantId) ?? null
  const composition = selectedProduct?.composition.filter((l) => l.refType === 'component') ?? []

  const costBreakdown =
    selectedVariant && selectedProduct ? calculateFullUnitCost(selectedVariant, selectedProduct, business) : null
  const unitCost = costBreakdown?.total ?? 0

  const consumption = composition.map((line) => {
    const component = components.find((c) => c.id === line.refId)
    const required = line.quantity * quantity
    return { line, component, required, available: component ? component.stock - required : null }
  })

  const hasShortage = consumption.some((c) => c.available != null && c.available < 0)
  const hasNoProducts = products.length === 0

  async function handleProduce() {
    if (!businessId || !user || !selectedProduct || !selectedVariant) return
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      await produceVariant(businessId, {
        variantId: selectedVariant.id,
        productName: selectedProduct.name,
        color: selectedVariant.color,
        size: selectedVariant.size,
        quantity,
        variantBaseCost: selectedVariant.baseCost,
        composition: selectedProduct.composition,
        laborCost: costBreakdown?.laborCost ?? 0,
        overheadCost: costBreakdown?.overheadCost ?? 0,
        userId: user.uid,
      })
      setSuccess(`+${quantity} unidades produzidas. Custo unitário: ${formatMoney(unitCost)}.`)
      setQuantity(1)
      const [freshVariants, freshComponents] = await Promise.all([listAllVariants(businessId), listComponents(businessId)])
      setVariants(freshVariants.filter((v) => v.active))
      setComponents(freshComponents.filter((c) => c.active))
    } catch (err) {
      setError(
        err instanceof InsufficientStockError || err instanceof Error
          ? err.message
          : 'Não foi possível registrar a produção.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bl-page">
      <PageHeader title="Produção" />

      {hasNoProducts ? (
        <div className="bl-card p-4 text-center small text-muted-bl">Cadastre um produto com variantes antes de registrar uma produção.</div>
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

          <div>
            <label className="form-label small fw-semibold">Quantidade a produzir</label>
            <QuantityInput value={quantity} onChange={setQuantity} />
          </div>

          {selectedVariant && (
            <div className="d-flex flex-column gap-2 pt-2" style={{ borderTop: '1px solid var(--bl-border)' }}>
              <div className="d-flex align-items-center justify-content-between">
                <span className="small fw-semibold d-flex align-items-center gap-2">
                  <ColorDot color={selectedVariant.color} size={10} />
                  Custo unitário estimado
                </span>
                <span className="fw-bold">{formatMoney(unitCost)}</span>
              </div>
              {costBreakdown && (
                <p className="small text-muted-bl mb-0">
                  Peça {formatMoney(costBreakdown.materialCost)} + Insumos {formatMoney(costBreakdown.compositionCost)} + Mão de obra{' '}
                  {formatMoney(costBreakdown.laborCost)} + Fixo {formatMoney(costBreakdown.overheadCost)}
                </p>
              )}

              {consumption.length > 0 && (
                <div className="d-flex flex-column gap-1">
                  <p className="small fw-semibold text-muted-bl mb-1">Insumos consumidos</p>
                  {consumption.map(({ line, required, available }) => (
                    <div key={line.refId} className="d-flex align-items-center justify-content-between small">
                      <span className="text-muted-bl">{line.name}</span>
                      <span style={{ color: available != null && available < 0 ? 'var(--bl-danger)' : 'var(--bl-text)' }}>
                        -{required} {available != null ? `(restam ${available})` : ''}
                      </span>
                    </div>
                  ))}
                  {hasShortage && (
                    <p className="small mb-0" style={{ color: 'var(--bl-danger)' }}>
                      Estoque de insumos insuficiente para essa quantidade.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary btn-lg fw-semibold"
            disabled={saving || !selectedVariant}
            onClick={handleProduce}
          >
            {saving ? 'Registrando…' : 'Registrar produção'}
          </button>
        </div>
      )}
    </div>
  )
}
