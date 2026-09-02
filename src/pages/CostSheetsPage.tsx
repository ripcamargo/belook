import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { ColorDot } from '../components/ColorDot'
import { useAuth } from '../hooks/useAuth'
import { listAllVariants, listProducts } from '../services/productService'
import { getBusiness } from '../services/businessService'
import type { Business, Product, ProductVariant } from '../types'
import { calculateFullUnitCost, calculateMargin } from '../utils/calculations'
import { formatMoney } from '../utils/money'
import { formatPercent } from '../utils/format'

export function CostSheetsPage() {
  const { businessId } = useAuth()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [business, setBusiness] = useState<Business | null>(null)

  useEffect(() => {
    if (!businessId) return
    Promise.all([listProducts(businessId), listAllVariants(businessId), getBusiness(businessId)]).then(([p, v, b]) => {
      setProducts(p.filter((x) => x.active))
      setVariants(v.filter((x) => x.active))
      setBusiness(b)
    })
  }, [businessId])

  if (!products || !business) return <LoadingScreen />

  return (
    <div className="bl-page">
      <PageHeader title="Fichas de custo" back />

      {products.length === 0 ? (
        <div className="bl-card p-4">
          <EmptyState
            icon="bi-calculator"
            title="Nenhum produto cadastrado"
            description="Cadastre um produto para montar sua ficha de custo e ver a margem de lucro."
          />
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {products.map((product) => {
            const productVariants = variants.filter((v) => v.productId === product.id)
            if (productVariants.length === 0) return null

            return (
              <Link key={product.id} to={`/products/${product.id}`} className="bl-card p-4 d-flex flex-column gap-2 text-decoration-none" style={{ color: 'var(--bl-text)' }}>
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <span className="fw-semibold text-truncate">{product.name}</span>
                  <span className="small text-muted-bl flex-shrink-0">
                    {product.sellingPrice != null ? `Venda ${formatMoney(product.sellingPrice)}` : 'Sem preço definido'}
                  </span>
                </div>
                <div className="d-flex flex-column gap-1">
                  {productVariants.map((v) => {
                    const unitCost = calculateFullUnitCost(v, product, business).total
                    const margin = calculateMargin(product.sellingPrice, unitCost)
                    return (
                      <div key={v.id} className="d-flex align-items-center justify-content-between gap-2 small">
                        <span className="d-flex align-items-center gap-2 text-muted-bl">
                          <ColorDot color={v.color} size={10} />
                          {v.color} / {v.size}
                        </span>
                        <span>
                          <span className="fw-semibold">{formatMoney(unitCost)}</span>
                          {margin != null && (
                            <span className="ms-2" style={{ color: margin >= 0 ? 'var(--bl-success)' : 'var(--bl-danger)' }}>
                              {formatPercent(margin)}
                            </span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
