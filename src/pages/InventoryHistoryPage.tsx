import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import { listRecentMovements } from '../services/inventoryService'
import type { InventoryMovement } from '../types'
import { formatDateShort } from '../utils/format'
import { formatMoney } from '../utils/money'
import { MOVEMENT_TYPE_LABELS } from '../utils/constants'

export function InventoryHistoryPage() {
  const { businessId } = useAuth()
  const [movements, setMovements] = useState<InventoryMovement[] | null>(null)

  useEffect(() => {
    if (!businessId) return
    listRecentMovements(businessId, 100).then(setMovements)
  }, [businessId])

  if (!movements) return <LoadingScreen />

  const groups = new Map<string, InventoryMovement[]>()
  for (const m of movements) {
    const key = formatDateShort(m.createdAt)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }

  return (
    <div className="bl-page">
      <PageHeader title="Histórico" back />

      {movements.length === 0 ? (
        <EmptyState icon="bi-clock-history" title="Nenhuma movimentação ainda" description="Registre uma entrada ou saída para ver o histórico aqui." />
      ) : (
        <div className="d-flex flex-column gap-4">
          {[...groups.entries()].map(([date, items]) => (
            <div key={date}>
              <p className="small fw-bold text-muted-bl mb-2">{date}</p>
              <div className="d-flex flex-column gap-2">
                {items.map((m) => {
                  const positive = m.quantity > 0
                  return (
                    <Link
                      key={m.id}
                      to={`/inventory/movements/${m.id}`}
                      className="bl-card p-3 d-flex align-items-center gap-3 text-decoration-none"
                      style={{ color: 'var(--bl-text)' }}
                    >
                      <span
                        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{
                          width: 40,
                          height: 40,
                          background: positive ? 'var(--bl-success-light)' : 'var(--bl-danger-light)',
                          color: positive ? 'var(--bl-success)' : 'var(--bl-danger)',
                        }}
                      >
                        <i className={`bi ${positive ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`} />
                      </span>
                      <span className="flex-fill min-width-0">
                        <span className="d-block fw-semibold text-truncate">
                          {positive ? '+' : ''}
                          {m.quantity} {m.targetName}
                        </span>
                        <span className="d-block small text-muted-bl">{MOVEMENT_TYPE_LABELS[m.type]}</span>
                      </span>
                      {m.totalCost != null && <span className="small fw-semibold flex-shrink-0">{formatMoney(m.totalCost)}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
