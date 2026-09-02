import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { ColorDot } from '../components/ColorDot'
import { useAuth } from '../hooks/useAuth'
import { listRecentSales } from '../services/salesService'
import type { Sale } from '../types'
import { formatDateShort } from '../utils/format'
import { formatMoney } from '../utils/money'

export function SalesPage() {
  const { businessId } = useAuth()
  const [sales, setSales] = useState<Sale[] | null>(null)

  useEffect(() => {
    if (!businessId) return
    listRecentSales(businessId).then(setSales)
  }, [businessId])

  if (!sales) return <LoadingScreen />

  const groups = new Map<string, Sale[]>()
  for (const sale of sales) {
    const key = formatDateShort(sale.soldAt)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(sale)
  }

  return (
    <div className="bl-page">
      <PageHeader
        title="Vendas"
        action={
          <Link to="/sales/new" className="btn btn-primary btn-sm fw-semibold">
            <i className="bi bi-plus-lg me-1" />
            Nova
          </Link>
        }
      />

      {sales.length === 0 ? (
        <div className="bl-card p-4">
          <EmptyState
            icon="bi-cart3"
            title="Nenhuma venda registrada"
            description="Registre sua primeira venda para acompanhar receita e lucro."
            action={
              <Link to="/sales/new" className="btn btn-primary fw-semibold px-4">
                Registrar venda
              </Link>
            }
          />
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {[...groups.entries()].map(([date, items]) => (
            <div key={date}>
              <p className="small fw-bold text-muted-bl mb-2">{date}</p>
              <div className="d-flex flex-column gap-2">
                {items.map((sale) => (
                  <div key={sale.id} className="bl-card p-3 d-flex flex-column gap-2">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <span className="fw-semibold text-truncate">{sale.customerName || 'Venda avulsa'}</span>
                      <span className="fw-bold flex-shrink-0">{formatMoney(sale.totalRevenue)}</span>
                    </div>
                    <div className="d-flex flex-column gap-1">
                      {sale.items.map((item, index) => (
                        <span key={index} className="d-flex align-items-center gap-2 small text-muted-bl">
                          <ColorDot color={item.color} size={10} />
                          {item.quantity}× {item.productName} — {item.color} / {item.size}
                        </span>
                      ))}
                    </div>
                    <div className="d-flex justify-content-between small" style={{ color: 'var(--bl-success)' }}>
                      <span>Lucro</span>
                      <span className="fw-semibold">{formatMoney(sale.profit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
