import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import { listAllVariants, listProducts } from '../services/productService'
import type { Product, ProductVariant } from '../types'
import { formatNumber } from '../utils/format'

export function ProductsPage() {
  const { businessId } = useAuth()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])

  useEffect(() => {
    if (!businessId) return
    Promise.all([listProducts(businessId), listAllVariants(businessId)]).then(([p, v]) => {
      setProducts(p)
      setVariants(v)
    })
  }, [businessId])

  if (!products) return <LoadingScreen />

  const activeProducts = products.filter((p) => p.active)

  return (
    <div className="bl-page">
      <PageHeader
        title="Produtos"
        action={
          <Link to="/products/new" className="btn btn-primary btn-sm fw-semibold">
            <i className="bi bi-plus-lg me-1" />
            Novo
          </Link>
        }
      />

      {activeProducts.length === 0 ? (
        <div className="bl-card p-4">
          <EmptyState
            icon="bi-tag"
            title="Você ainda não possui produtos"
            description="Cadastre sua primeira camiseta para começar."
            action={
              <Link to="/products/new" className="btn btn-primary fw-semibold px-4">
                Cadastrar produto
              </Link>
            }
          />
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {activeProducts.map((product) => {
            const productVariants = variants.filter((v) => v.productId === product.id && v.active)
            const totalStock = productVariants.reduce((acc, v) => acc + v.stock, 0)
            const hasLowStock = productVariants.some((v) => v.stock < v.minStock)

            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="bl-card p-3 d-flex align-items-center gap-3 text-decoration-none"
                style={{ color: 'var(--bl-text)' }}
              >
                <span
                  className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{ width: 44, height: 44, background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }}
                >
                  <i className="bi bi-tag fs-5" />
                </span>
                <span className="flex-fill min-width-0">
                  <span className="d-block fw-semibold text-truncate">{product.name}</span>
                  <span className="d-block small text-muted-bl">
                    {product.category ?? 'Sem categoria'} · {productVariants.length}{' '}
                    {productVariants.length === 1 ? 'variante' : 'variantes'} · {formatNumber(totalStock)} un.
                  </span>
                </span>
                {hasLowStock && <i className="bi bi-exclamation-triangle-fill" style={{ color: 'var(--bl-warning)' }} />}
                <i className="bi bi-chevron-right text-muted-bl" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
