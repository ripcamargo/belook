import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import { listOrders } from '../services/orderService'
import type { Order, OrderStatus } from '../types'
import { ORDER_STATUS_LABELS } from '../utils/constants'
import { formatDate } from '../utils/format'
import { formatMoney } from '../utils/money'

const STATUS_STYLE: Record<OrderStatus, { bg: string; color: string }> = {
  recebido: { bg: 'var(--bl-info-light, #e6f0ff)', color: 'var(--bl-info)' },
  em_producao: { bg: 'var(--bl-warning-light)', color: 'var(--bl-warning)' },
  pronto: { bg: 'var(--bl-primary-light)', color: 'var(--bl-primary)' },
  entregue: { bg: 'var(--bl-success-light)', color: 'var(--bl-success)' },
  cancelado: { bg: 'var(--bl-danger-light)', color: 'var(--bl-danger)' },
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLE[status]
  return (
    <span className="badge rounded-pill fw-semibold" style={{ background: style.bg, color: style.color }}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}

export function OrdersPage() {
  const { businessId } = useAuth()
  const [orders, setOrders] = useState<Order[] | null>(null)

  useEffect(() => {
    if (!businessId) return
    listOrders(businessId).then(setOrders)
  }, [businessId])

  if (!orders) return <LoadingScreen />

  return (
    <div className="bl-page">
      <PageHeader
        title="Pedidos"
        action={
          <Link to="/orders/new" className="btn btn-primary btn-sm fw-semibold">
            <i className="bi bi-plus-lg me-1" />
            Novo
          </Link>
        }
      />

      {orders.length === 0 ? (
        <div className="bl-card p-4">
          <EmptyState
            icon="bi-bag"
            title="Nenhum pedido registrado"
            description="Registre pedidos personalizados e acompanhe o status até a entrega."
            action={
              <Link to="/orders/new" className="btn btn-primary fw-semibold px-4">
                Novo pedido
              </Link>
            }
          />
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="bl-card p-3 d-flex flex-column gap-2 text-decoration-none"
              style={{ color: 'var(--bl-text)' }}
            >
              <div className="d-flex align-items-center justify-content-between gap-2">
                <span className="fw-semibold text-truncate">{order.customerName || 'Pedido avulso'}</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="d-flex align-items-center justify-content-between gap-2 small text-muted-bl">
                <span>
                  {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                  {order.dueDate ? ` · Prazo ${formatDate(order.dueDate)}` : ''}
                </span>
                <span className="fw-semibold" style={{ color: 'var(--bl-text)' }}>
                  {formatMoney(order.totalValue)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
