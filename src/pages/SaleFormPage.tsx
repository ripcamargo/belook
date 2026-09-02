import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { ColorDot } from '../components/ColorDot'
import { QuantityInput } from '../components/QuantityInput'
import { MoneyInput } from '../components/MoneyInput'
import { useAuth } from '../hooks/useAuth'
import { listAllVariants, listProducts } from '../services/productService'
import { listCustomers } from '../services/customerService'
import { createSale, type SaleItemInput } from '../services/salesService'
import { InsufficientStockError } from '../services/inventoryService'
import { getBusiness } from '../services/businessService'
import type { Business, Customer, Product, ProductVariant } from '../types'
import { calculateFullUnitCost } from '../utils/calculations'
import { formatMoney, sumCents } from '../utils/money'

interface CartItem extends SaleItemInput {
  key: string
}

export function SaleFormPage() {
  const navigate = useNavigate()
  const { businessId, user } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [cart, setCart] = useState<CartItem[]>([])

  const [customerId, setCustomerId] = useState('')
  const [note, setNote] = useState('')

  const [itemError, setItemError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!businessId) return
    Promise.all([listProducts(businessId), listAllVariants(businessId), listCustomers(businessId), getBusiness(businessId)]).then(
      ([p, v, c, b]) => {
        setProducts(p.filter((x) => x.active))
        setVariants(v.filter((x) => x.active))
        setCustomers(c.filter((x) => x.active))
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

  const selectedProduct = products.find((p) => p.id === productId) ?? null
  const selectedVariant = variants.find((v) => v.id === variantId) ?? null

  useEffect(() => {
    setUnitPrice(selectedProduct?.sellingPrice ?? 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct?.id])

  if (loading || !business) return <LoadingScreen />

  const reservedInCart = (variantId_: string) =>
    cart.filter((c) => c.variantId === variantId_).reduce((acc, c) => acc + c.quantity, 0)

  function addItem() {
    setItemError(null)
    if (!selectedProduct || !selectedVariant || !business) {
      setItemError('Selecione um produto e uma variante.')
      return
    }
    const available = selectedVariant.stock - reservedInCart(selectedVariant.id)
    if (quantity > available) {
      setItemError(`Estoque disponível: ${available}.`)
      return
    }

    setCart((c) => [
      ...c,
      {
        key: `${selectedVariant.id}-${Date.now()}`,
        variantId: selectedVariant.id,
        productName: selectedProduct.name,
        color: selectedVariant.color,
        size: selectedVariant.size,
        quantity,
        unitPrice,
        unitCost: calculateFullUnitCost(selectedVariant, selectedProduct, business).total,
      },
    ])
    setQuantity(1)
  }

  function removeItem(key: string) {
    setCart((c) => c.filter((item) => item.key !== key))
  }

  const totalRevenue = sumCents(cart.map((c) => c.unitPrice * c.quantity))
  const totalCost = sumCents(cart.map((c) => c.unitCost * c.quantity))
  const profit = totalRevenue - totalCost

  async function handleSubmit() {
    if (!businessId || !user) return
    setError(null)
    if (cart.length === 0) {
      setError('Adicione ao menos um item à venda.')
      return
    }
    setSaving(true)
    try {
      const customer = customers.find((c) => c.id === customerId)
      await createSale(businessId, {
        customerId: customer?.id,
        customerName: customer?.name,
        note: note.trim() || undefined,
        userId: user.uid,
        items: cart.map(({ key: _key, ...item }) => item),
      })
      navigate('/sales', { replace: true })
    } catch (err) {
      setError(
        err instanceof InsufficientStockError || err instanceof Error
          ? err.message
          : 'Não foi possível registrar a venda.',
      )
    } finally {
      setSaving(false)
    }
  }

  const hasNoProducts = products.length === 0

  return (
    <div className="bl-page">
      <PageHeader title="Nova venda" back />

      {hasNoProducts ? (
        <div className="bl-card p-4 text-center small text-muted-bl">Cadastre um produto com estoque antes de registrar uma venda.</div>
      ) : (
        <>
          <div className="bl-card p-4 d-flex flex-column gap-3 mb-3">
            <h2 className="h6 fw-bold mb-0">Adicionar item</h2>

            {itemError && (
              <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
                {itemError}
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
                    {v.color} / {v.size} — estoque {v.stock - reservedInCart(v.id)}
                  </option>
                ))}
              </select>
            </div>

            <div className="row g-2">
              <div className="col-6">
                <label className="form-label small fw-semibold">Quantidade</label>
                <QuantityInput value={quantity} onChange={setQuantity} />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold">Preço unitário</label>
                <MoneyInput value={unitPrice} onChange={setUnitPrice} />
              </div>
            </div>

            <button type="button" className="btn fw-semibold" style={{ background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }} onClick={addItem}>
              <i className="bi bi-plus-lg me-1" />
              Adicionar à venda
            </button>
          </div>

          {cart.length > 0 && (
            <div className="d-flex flex-column gap-2 mb-3">
              {cart.map((item) => (
                <div key={item.key} className="bl-card p-3 d-flex align-items-center gap-3">
                  <span className="flex-fill min-width-0">
                    <span className="d-flex align-items-center gap-2 fw-semibold">
                      <ColorDot color={item.color} />
                      {item.productName} — {item.color} / {item.size}
                    </span>
                    <span className="d-block small text-muted-bl">
                      {item.quantity} × {formatMoney(item.unitPrice)} = {formatMoney(item.quantity * item.unitPrice)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm p-0 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}
                    onClick={() => removeItem(item.key)}
                    aria-label="Remover item"
                  >
                    <i className="bi bi-trash" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bl-card p-4 d-flex flex-column gap-3 mb-3">
            {error && (
              <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="form-label small fw-semibold">Cliente (opcional)</label>
              <select className="form-select" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Venda avulsa</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="small text-muted-bl mb-0 mt-1">
                  <Link to="/customers/new">Cadastre um cliente</Link> para associá-lo às vendas.
                </p>
              )}
            </div>

            <div>
              <label className="form-label small fw-semibold">Observação (opcional)</label>
              <input type="text" className="form-control" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="d-flex flex-column gap-1 pt-2" style={{ borderTop: '1px solid var(--bl-border)' }}>
              <div className="d-flex justify-content-between small text-muted-bl">
                <span>Total</span>
                <span className="fw-semibold" style={{ color: 'var(--bl-text)' }}>{formatMoney(totalRevenue)}</span>
              </div>
              <div className="d-flex justify-content-between small text-muted-bl">
                <span>Lucro estimado</span>
                <span className="fw-semibold" style={{ color: 'var(--bl-success)' }}>{formatMoney(profit)}</span>
              </div>
            </div>

            <button type="button" className="btn btn-primary btn-lg fw-semibold" disabled={saving || cart.length === 0} onClick={handleSubmit}>
              {saving ? 'Registrando…' : 'Registrar venda'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
