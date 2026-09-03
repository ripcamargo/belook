import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAuth } from '../hooks/useAuth'
import { deleteMovement, getMovement } from '../services/inventoryService'
import type { InventoryMovement } from '../types'
import { MOVEMENT_TYPE_LABELS } from '../utils/constants'
import { formatDateTime } from '../utils/format'
import { formatMoney } from '../utils/money'

export function MovementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { businessId } = useAuth()

  const [movement, setMovement] = useState<InventoryMovement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!businessId || !id) return
    setLoading(true)
    getMovement(businessId, id).then((m) => {
      setMovement(m)
      setLoading(false)
    })
  }, [businessId, id])

  if (loading) return <LoadingScreen />
  if (!movement) return <LoadingScreen />

  const positive = movement.quantity > 0
  const isAutomatic = movement.type === 'venda' || movement.type === 'producao'

  return (
    <div className="bl-page">
      <PageHeader title="Movimentação" back />

      <div className="bl-card p-4 d-flex flex-column gap-3 mb-3">
        {error && (
          <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
            {error}
          </div>
        )}

        <div>
          <span className="d-block fw-semibold">{movement.targetName}</span>
          <span className="d-block small text-muted-bl">{formatDateTime(movement.createdAt)}</span>
        </div>

        <div className="d-flex flex-column gap-1" style={{ borderTop: '1px solid var(--bl-border)', paddingTop: 12 }}>
          <div className="d-flex justify-content-between small">
            <span className="text-muted-bl">Tipo</span>
            <span className="fw-semibold">{MOVEMENT_TYPE_LABELS[movement.type]}</span>
          </div>
          <div className="d-flex justify-content-between small">
            <span className="text-muted-bl">Quantidade</span>
            <span className="fw-semibold" style={{ color: positive ? 'var(--bl-success)' : 'var(--bl-danger)' }}>
              {positive ? '+' : ''}
              {movement.quantity}
            </span>
          </div>
          {movement.totalCost != null && (
            <div className="d-flex justify-content-between small">
              <span className="text-muted-bl">Custo total</span>
              <span className="fw-semibold">{formatMoney(movement.totalCost)}</span>
            </div>
          )}
          <div className="d-flex justify-content-between small">
            <span className="text-muted-bl">Saldo resultante</span>
            <span className="fw-semibold">{movement.resultingStock}</span>
          </div>
        </div>

        {(movement.reason || movement.supplierName || movement.note) && (
          <div className="d-flex flex-column gap-1" style={{ borderTop: '1px solid var(--bl-border)', paddingTop: 12 }}>
            {movement.reason && (
              <div className="d-flex justify-content-between small">
                <span className="text-muted-bl">Motivo</span>
                <span className="fw-semibold">{movement.reason}</span>
              </div>
            )}
            {movement.supplierName && (
              <div className="d-flex justify-content-between small">
                <span className="text-muted-bl">Fornecedor</span>
                <span className="fw-semibold">{movement.supplierName}</span>
              </div>
            )}
            {movement.note && (
              <div>
                <span className="d-block small text-muted-bl">Observação</span>
                <span className="small">{movement.note}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {isAutomatic ? (
        <p className="small text-muted-bl px-1">
          Essa movimentação foi gerada automaticamente por uma {movement.type === 'venda' ? 'venda' : 'produção'}. Para
          reverter o estoque, exclua o registro de origem em vez desta movimentação.
        </p>
      ) : (
        <button
          type="button"
          className="btn w-100 fw-semibold"
          style={{ color: 'var(--bl-danger)' }}
          onClick={() => setConfirmDelete(true)}
          disabled={deleting}
        >
          Excluir movimentação
        </button>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir movimentação?"
        description="O saldo do item volta ao valor anterior a essa movimentação. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (!businessId || !movement) return
          setDeleting(true)
          setError(null)
          try {
            await deleteMovement(businessId, movement.id)
            navigate('/inventory/history', { replace: true })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Não foi possível excluir.')
            setConfirmDelete(false)
            setDeleting(false)
          }
        }}
      />
    </div>
  )
}
