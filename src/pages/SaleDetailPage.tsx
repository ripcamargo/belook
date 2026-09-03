import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ColorDot } from '../components/ColorDot'
import { useAuth } from '../hooks/useAuth'
import { deleteSale, getSale } from '../services/salesService'
import type { Sale } from '../types'
import { formatDateTime } from '../utils/format'
import { formatMoney } from '../utils/money'

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { businessId } = useAuth()

  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!businessId || !id) return
    setLoading(true)
    getSale(businessId, id).then((s) => {
      setSale(s)
      setLoading(false)
    })
  }, [businessId, id])

  if (loading) return <LoadingScreen />
  if (!sale) return <LoadingScreen />

  return (
    <div className="bl-page">
      <PageHeader title="Venda" back />

      <div className="bl-card p-4 d-flex flex-column gap-3 mb-3">
        {error && (
          <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
            {error}
          </div>
        )}

        <div>
          <span className="d-block fw-semibold">{sale.customerName || 'Venda avulsa'}</span>
          <span className="d-block small text-muted-bl">{formatDateTime(sale.soldAt)}</span>
        </div>

        <div className="d-flex flex-column gap-2" style={{ borderTop: '1px solid var(--bl-border)', paddingTop: 12 }}>
          {sale.items.map((item, index) => (
            <div key={index} className="d-flex align-items-center justify-content-between gap-2">
              <span className="d-flex align-items-center gap-2 small">
                <ColorDot color={item.color} size={10} />
                {item.quantity}× {item.productName} — {item.color} / {item.size}
              </span>
              <span className="small fw-semibold flex-shrink-0">{formatMoney(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="d-flex flex-column gap-1" style={{ borderTop: '1px solid var(--bl-border)', paddingTop: 12 }}>
          <div className="d-flex justify-content-between small">
            <span className="text-muted-bl">Receita</span>
            <span className="fw-semibold">{formatMoney(sale.totalRevenue)}</span>
          </div>
          <div className="d-flex justify-content-between small">
            <span className="text-muted-bl">Custo</span>
            <span className="fw-semibold">{formatMoney(sale.totalCost)}</span>
          </div>
          <div className="d-flex justify-content-between small" style={{ color: 'var(--bl-success)' }}>
            <span>Lucro</span>
            <span className="fw-semibold">{formatMoney(sale.profit)}</span>
          </div>
        </div>

        {sale.note && (
          <div style={{ borderTop: '1px solid var(--bl-border)', paddingTop: 12 }}>
            <span className="d-block small text-muted-bl">Observação</span>
            <span className="small">{sale.note}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn w-100 fw-semibold"
        style={{ color: 'var(--bl-danger)' }}
        onClick={() => setConfirmDelete(true)}
        disabled={deleting}
      >
        Excluir venda
      </button>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir venda?"
        description="Os itens vendidos voltam ao estoque das variantes. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (!businessId || !sale) return
          setDeleting(true)
          setError(null)
          try {
            await deleteSale(businessId, sale.id)
            navigate('/sales', { replace: true })
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
