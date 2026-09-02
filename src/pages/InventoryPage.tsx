import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { StockBadge } from '../components/StockBadge'
import { ColorDot } from '../components/ColorDot'
import { useAuth } from '../hooks/useAuth'
import { listAllVariants, listProducts } from '../services/productService'
import { listComponents } from '../services/componentService'
import type { Component, Product, ProductVariant } from '../types'
import { calculateInventoryValue, filterLowStock } from '../utils/calculations'
import { formatMoney } from '../utils/money'

type Tab = 'produtos' | 'insumos'

export function InventoryPage() {
  const { businessId } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('produtos')
  const [onlyLowStock, setOnlyLowStock] = useState(false)

  useEffect(() => {
    if (!businessId) return
    Promise.all([listProducts(businessId), listAllVariants(businessId), listComponents(businessId)]).then(
      ([p, v, c]) => {
        setProducts(p)
        setVariants(v.filter((variant) => variant.active))
        setComponents(c.filter((component) => component.active))
        setLoading(false)
      },
    )
  }, [businessId])

  const productNameById = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products])

  const inventoryValue = calculateInventoryValue([
    ...variants.map((v) => ({ stock: v.stock, unitCost: v.baseCost })),
    ...components.map((c) => ({ stock: c.stock, unitCost: c.unitCost })),
  ])
  const lowStockCount = filterLowStock(variants).length + filterLowStock(components).length
  const totalUnits = variants.reduce((acc, v) => acc + v.stock, 0)

  if (loading) return <LoadingScreen />

  const visibleVariants = onlyLowStock ? filterLowStock(variants) : variants
  const visibleComponents = onlyLowStock ? filterLowStock(components) : components

  return (
    <div className="bl-page">
      <PageHeader
        title="Estoque"
        action={
          <Link to="/inventory/history" className="btn btn-sm fw-semibold" style={{ color: 'var(--bl-primary)' }}>
            Histórico
          </Link>
        }
      />

      <div className="row g-2 mb-3">
        <div className="col-6">
          <div className="bl-card p-3 h-100">
            <p className="small text-muted-bl mb-1">Em estoque</p>
            <p className="h5 fw-bold mb-0">{totalUnits} un.</p>
          </div>
        </div>
        <div className="col-6">
          <div className="bl-card p-3 h-100">
            <p className="small text-muted-bl mb-1">Valor investido</p>
            <p className="h5 fw-bold mb-0">{formatMoney(inventoryValue)}</p>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="btn-group flex-fill" role="group">
          <button
            type="button"
            className="btn fw-semibold"
            style={{
              background: tab === 'produtos' ? 'var(--bl-primary)' : 'var(--bl-surface-2)',
              color: tab === 'produtos' ? '#fff' : 'var(--bl-text)',
            }}
            onClick={() => setTab('produtos')}
          >
            Produtos
          </button>
          <button
            type="button"
            className="btn fw-semibold"
            style={{
              background: tab === 'insumos' ? 'var(--bl-primary)' : 'var(--bl-surface-2)',
              color: tab === 'insumos' ? '#fff' : 'var(--bl-text)',
            }}
            onClick={() => setTab('insumos')}
          >
            Insumos
          </button>
        </div>
        <button
          type="button"
          className="btn btn-sm fw-semibold d-flex align-items-center gap-1 flex-shrink-0"
          style={{
            background: onlyLowStock ? 'var(--bl-warning-light)' : 'var(--bl-surface-2)',
            color: onlyLowStock ? 'var(--bl-warning)' : 'var(--bl-text-muted)',
          }}
          onClick={() => setOnlyLowStock((v) => !v)}
        >
          <i className="bi bi-exclamation-triangle-fill" />
          {lowStockCount}
        </button>
      </div>

      {tab === 'produtos' &&
        (visibleVariants.length === 0 ? (
          <EmptyState
            icon="bi-box-seam"
            title={onlyLowStock ? 'Nenhum item abaixo do mínimo' : 'Nenhuma variante ativa'}
            description={onlyLowStock ? undefined : 'Cadastre produtos e variantes para começar.'}
          />
        ) : (
          <div className="d-flex flex-column gap-2">
            {visibleVariants.map((v) => (
              <Link
                key={v.id}
                to={`/products/${v.productId}`}
                className="bl-card p-3 d-flex align-items-center gap-3 text-decoration-none"
                style={{ color: 'var(--bl-text)' }}
              >
                <span className="flex-fill min-width-0">
                  <span className="d-block fw-semibold text-truncate">{productNameById.get(v.productId) ?? '—'}</span>
                  <span className="d-flex align-items-center gap-2 small text-muted-bl">
                    <ColorDot color={v.color} size={10} />
                    {v.color} / {v.size}
                  </span>
                </span>
                <StockBadge stock={v.stock} minStock={v.minStock} />
              </Link>
            ))}
          </div>
        ))}

      {tab === 'insumos' &&
        (visibleComponents.length === 0 ? (
          <EmptyState
            icon="bi-stars"
            title={onlyLowStock ? 'Nenhum item abaixo do mínimo' : 'Nenhum insumo ativo'}
            description={onlyLowStock ? undefined : 'Cadastre DTF, embalagens e etiquetas.'}
          />
        ) : (
          <div className="d-flex flex-column gap-2">
            {visibleComponents.map((c) => (
              <Link
                key={c.id}
                to={`/components/${c.id}`}
                className="bl-card p-3 d-flex align-items-center gap-3 text-decoration-none"
                style={{ color: 'var(--bl-text)' }}
              >
                <span className="flex-fill min-width-0">
                  <span className="d-block fw-semibold text-truncate">{c.name}</span>
                  <span className="d-block small text-muted-bl">{c.unit}</span>
                </span>
                <StockBadge stock={c.stock} minStock={c.minStock} />
              </Link>
            ))}
          </div>
        ))}
    </div>
  )
}
