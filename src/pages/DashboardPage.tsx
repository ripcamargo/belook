import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { StockBadge } from '../components/StockBadge'
import { getBusiness } from '../services/businessService'
import { listAllVariants, listProducts } from '../services/productService'
import { listComponents } from '../services/componentService'
import { listRecentSales } from '../services/salesService'
import { listOrders } from '../services/orderService'
import type { Component, Order, Product, ProductVariant, Sale } from '../types'
import { filterLowStock } from '../utils/calculations'
import { formatMoney, sumCents } from '../utils/money'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function startOfDay(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

function startOfMonth(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
}

export function DashboardPage() {
  const { user, businessId } = useAuth()
  const firstName = (user?.displayName || user?.email?.split('@')[0] || '').split(' ')[0]

  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!businessId) return
    getBusiness(businessId).then((business) => setCompanyName(business?.name ?? ''))
  }, [businessId])

  useEffect(() => {
    if (!businessId) return
    Promise.all([
      listProducts(businessId),
      listAllVariants(businessId),
      listComponents(businessId),
      listRecentSales(businessId, 200),
      listOrders(businessId),
    ]).then(([p, v, c, s, o]) => {
      setProducts(p.filter((x) => x.active))
      setVariants(v.filter((x) => x.active))
      setComponents(c.filter((x) => x.active))
      setSales(s)
      setOrders(o)
      setLoading(false)
    })
  }, [businessId])

  if (loading) return <LoadingScreen />

  const header = (
    <header className="pt-2 mb-4">
      <p className="text-muted-bl mb-0">
        {greeting()} 👋 <span className="text-capitalize">{firstName}</span>
      </p>
      <h1 className="h4 fw-bold mb-0">{companyName || 'Seu negócio'}</h1>
    </header>
  )

  if (products.length === 0) {
    return (
      <div className="bl-page">
        {header}
        <div className="bl-card p-4">
          <EmptyState
            icon="bi-rocket-takeoff"
            title="Vamos configurar seu estoque"
            description="Cadastre seu primeiro produto para começar a acompanhar estoque, custos e vendas."
            action={
              <Link to="/products" className="btn btn-primary fw-semibold px-4">
                Cadastrar produto
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const todayStart = startOfDay()
  const monthStart = startOfMonth()
  const todaySales = sales.filter((s) => s.soldAt >= todayStart)
  const monthSales = sales.filter((s) => s.soldAt >= monthStart)
  const todayRevenue = sumCents(todaySales.map((s) => s.totalRevenue))
  const monthRevenue = sumCents(monthSales.map((s) => s.totalRevenue))
  const monthProfit = sumCents(monthSales.map((s) => s.profit))

  const productNameById = new Map(products.map((p) => [p.id, p.name]))
  const lowStockVariants = filterLowStock(variants)
  const lowStockComponents = filterLowStock(components)
  const lowStockCount = lowStockVariants.length + lowStockComponents.length

  const pendingOrders = orders.filter((o) => o.status !== 'entregue' && o.status !== 'cancelado')
  const recentSales = sales.slice(0, 4)

  return (
    <div className="bl-page">
      {header}

      <div className="row g-2 mb-3">
        <div className="col-6">
          <div className="bl-card p-3">
            <span className="d-block small text-muted-bl">Vendas hoje</span>
            <span className="d-block h5 fw-bold mb-0">{formatMoney(todayRevenue)}</span>
            <span className="d-block small text-muted-bl">
              {todaySales.length} {todaySales.length === 1 ? 'venda' : 'vendas'}
            </span>
          </div>
        </div>
        <div className="col-6">
          <div className="bl-card p-3">
            <span className="d-block small text-muted-bl">Faturamento do mês</span>
            <span className="d-block h5 fw-bold mb-0">{formatMoney(monthRevenue)}</span>
            <span className="d-block small" style={{ color: monthProfit >= 0 ? 'var(--bl-success)' : 'var(--bl-danger)' }}>
              Lucro {formatMoney(monthProfit)}
            </span>
          </div>
        </div>
      </div>

      <div className="d-flex flex-column gap-2 mb-3">
        <Link
          to="/inventory"
          className="bl-card p-3 d-flex align-items-center gap-3 text-decoration-none"
          style={{ color: 'var(--bl-text)' }}
        >
          <span
            className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
            style={{
              width: 40,
              height: 40,
              background: lowStockCount > 0 ? 'var(--bl-warning-light)' : 'var(--bl-success-light)',
              color: lowStockCount > 0 ? 'var(--bl-warning)' : 'var(--bl-success)',
            }}
          >
            <i className={`bi ${lowStockCount > 0 ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`} />
          </span>
          <span className="flex-fill">
            <span className="d-block fw-semibold">{lowStockCount > 0 ? `${lowStockCount} itens com estoque baixo` : 'Estoque em dia'}</span>
            <span className="d-block small text-muted-bl">Ver estoque</span>
          </span>
          <i className="bi bi-chevron-right text-muted-bl" />
        </Link>

        {pendingOrders.length > 0 && (
          <Link
            to="/orders"
            className="bl-card p-3 d-flex align-items-center gap-3 text-decoration-none"
            style={{ color: 'var(--bl-text)' }}
          >
            <span
              className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
              style={{ width: 40, height: 40, background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }}
            >
              <i className="bi bi-bag" />
            </span>
            <span className="flex-fill">
              <span className="d-block fw-semibold">
                {pendingOrders.length} {pendingOrders.length === 1 ? 'pedido em aberto' : 'pedidos em aberto'}
              </span>
              <span className="d-block small text-muted-bl">Ver pedidos</span>
            </span>
            <i className="bi bi-chevron-right text-muted-bl" />
          </Link>
        )}
      </div>

      {lowStockVariants.length > 0 && (
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-2 px-1">
            <h2 className="h6 fw-bold mb-0">Estoque baixo</h2>
            <Link to="/inventory" className="small fw-semibold" style={{ color: 'var(--bl-primary)' }}>
              Ver tudo
            </Link>
          </div>
          <div className="d-flex flex-column gap-2">
            {lowStockVariants.slice(0, 3).map((v) => (
              <Link
                key={v.id}
                to={`/products/${v.productId}`}
                className="bl-card p-3 d-flex align-items-center gap-3 text-decoration-none"
                style={{ color: 'var(--bl-text)' }}
              >
                <span className="flex-fill min-width-0">
                  <span className="d-block fw-semibold text-truncate">{productNameById.get(v.productId) ?? '—'}</span>
                  <span className="d-block small text-muted-bl">
                    {v.color} / {v.size}
                  </span>
                </span>
                <StockBadge stock={v.stock} minStock={v.minStock} />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="d-flex align-items-center justify-content-between mb-2 px-1">
          <h2 className="h6 fw-bold mb-0">Vendas recentes</h2>
          <Link to="/sales" className="small fw-semibold" style={{ color: 'var(--bl-primary)' }}>
            Ver tudo
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <div className="bl-card p-4 text-center small text-muted-bl">Nenhuma venda registrada ainda.</div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {recentSales.map((sale) => (
              <div key={sale.id} className="bl-card p-3 d-flex align-items-center justify-content-between gap-2">
                <span className="text-truncate">{sale.customerName || 'Venda avulsa'}</span>
                <span className="fw-semibold flex-shrink-0">{formatMoney(sale.totalRevenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
