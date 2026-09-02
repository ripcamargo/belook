import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { QuantityInput } from '../components/QuantityInput'
import { MoneyInput } from '../components/MoneyInput'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAuth } from '../hooks/useAuth'
import { createOrder, getOrder, setOrderStatus, updateOrder } from '../services/orderService'
import { listCustomers } from '../services/customerService'
import type { Customer, Order, OrderItem, OrderStatus } from '../types'
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from '../utils/constants'
import { formatMoney, sumCents } from '../utils/money'

interface CartItem extends OrderItem {
  key: string
}

export function OrderFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { businessId } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const [customerId, setCustomerId] = useState('')
  const [note, setNote] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [unitCostEstimate, setUnitCostEstimate] = useState(0)

  const [itemError, setItemError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    if (!businessId) return
    const loadCustomers = listCustomers(businessId).then((c) => setCustomers(c.filter((x) => x.active)))
    if (isNew) {
      loadCustomers.then(() => setLoading(false))
      return
    }
    if (!id) return
    Promise.all([getOrder(businessId, id), loadCustomers]).then(([o]) => {
      if (o) {
        setOrder(o)
        setCustomerId(o.customerId ?? '')
        setNote(o.note ?? '')
        setDueDate(o.dueDate ? new Date(o.dueDate).toISOString().slice(0, 10) : '')
        setCart(o.items.map((item, index) => ({ ...item, key: `${index}-${item.description}` })))
      }
      setLoading(false)
    })
  }, [businessId, id, isNew])

  if (loading) return <LoadingScreen />

  function addItem() {
    setItemError(null)
    if (!description.trim()) {
      setItemError('Descreva o item do pedido.')
      return
    }
    setCart((c) => [...c, { key: `${Date.now()}`, description: description.trim(), quantity, unitPrice, unitCostEstimate }])
    setDescription('')
    setQuantity(1)
    setUnitPrice(0)
    setUnitCostEstimate(0)
  }

  function removeItem(key: string) {
    setCart((c) => c.filter((item) => item.key !== key))
  }

  const totalValue = sumCents(cart.map((c) => c.unitPrice * c.quantity))
  const totalCostEstimate = sumCents(cart.map((c) => c.unitCostEstimate * c.quantity))

  async function handleSubmit() {
    if (!businessId) return
    setError(null)
    if (cart.length === 0) {
      setError('Adicione ao menos um item ao pedido.')
      return
    }
    setSaving(true)
    try {
      const customer = customers.find((c) => c.id === customerId)
      const input = {
        customerId: customer?.id,
        customerName: customer?.name,
        note: note.trim() || undefined,
        dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).getTime() : null,
        items: cart.map(({ key: _key, ...item }) => item),
      }
      if (isNew) {
        const newId = await createOrder(businessId, input)
        navigate(`/orders/${newId}`, { replace: true })
      } else if (order) {
        await updateOrder(businessId, order.id, input)
        navigate('/orders')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(status: OrderStatus) {
    if (!businessId || !order) return
    await setOrderStatus(businessId, order.id, status)
    setOrder({ ...order, status })
  }

  const nextStatus = order ? ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(order.status) + 1] : undefined

  return (
    <div className="bl-page">
      <PageHeader title={isNew ? 'Novo pedido' : 'Pedido'} back />

      {order && order.status !== 'cancelado' && (
        <div className="bl-card p-4 d-flex align-items-center justify-content-between gap-2 mb-3">
          <span>
            <span className="d-block small text-muted-bl">Status atual</span>
            <span className="d-block fw-bold">{ORDER_STATUS_LABELS[order.status]}</span>
          </span>
          <div className="d-flex gap-2">
            {order.status !== 'entregue' && (
              <button type="button" className="btn btn-sm fw-semibold" style={{ color: 'var(--bl-danger)' }} onClick={() => setConfirmCancel(true)}>
                Cancelar
              </button>
            )}
            {nextStatus && (
              <button
                type="button"
                className="btn btn-sm btn-primary fw-semibold"
                onClick={() => handleStatusChange(nextStatus)}
              >
                Marcar como {ORDER_STATUS_LABELS[nextStatus]}
              </button>
            )}
          </div>
        </div>
      )}
      {order?.status === 'cancelado' && (
        <div className="bl-card p-3 mb-3 text-center small fw-semibold" style={{ color: 'var(--bl-danger)' }}>
          Este pedido foi cancelado.
        </div>
      )}

      <div className="bl-card p-4 d-flex flex-column gap-3 mb-3">
        <h2 className="h6 fw-bold mb-0">Adicionar item</h2>

        {itemError && (
          <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
            {itemError}
          </div>
        )}

        <div>
          <label className="form-label small fw-semibold">Descrição</label>
          <input
            type="text"
            className="form-control"
            placeholder="Camiseta estampa personalizada"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="row g-2">
          <div className="col-4">
            <label className="form-label small fw-semibold">Qtd.</label>
            <QuantityInput value={quantity} onChange={setQuantity} />
          </div>
          <div className="col-4">
            <label className="form-label small fw-semibold">Preço unit.</label>
            <MoneyInput value={unitPrice} onChange={setUnitPrice} />
          </div>
          <div className="col-4">
            <label className="form-label small fw-semibold">Custo est.</label>
            <MoneyInput value={unitCostEstimate} onChange={setUnitCostEstimate} />
          </div>
        </div>

        <button type="button" className="btn fw-semibold" style={{ background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }} onClick={addItem}>
          <i className="bi bi-plus-lg me-1" />
          Adicionar item
        </button>
      </div>

      {cart.length > 0 && (
        <div className="d-flex flex-column gap-2 mb-3">
          {cart.map((item) => (
            <div key={item.key} className="bl-card p-3 d-flex align-items-center gap-3">
              <span className="flex-fill min-width-0">
                <span className="d-block fw-semibold text-truncate">{item.description}</span>
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

      <div className="bl-card p-4 d-flex flex-column gap-3">
        {error && (
          <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
            {error}
          </div>
        )}

        <div>
          <label className="form-label small fw-semibold">Cliente (opcional)</label>
          <select className="form-select" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Pedido avulso</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {customers.length === 0 && (
            <p className="small text-muted-bl mb-0 mt-1">
              <Link to="/customers/new">Cadastre um cliente</Link> para associá-lo aos pedidos.
            </p>
          )}
        </div>

        <div>
          <label className="form-label small fw-semibold">Prazo de entrega (opcional)</label>
          <input type="date" className="form-control" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div>
          <label className="form-label small fw-semibold">Observação (opcional)</label>
          <input type="text" className="form-control" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="d-flex flex-column gap-1 pt-2" style={{ borderTop: '1px solid var(--bl-border)' }}>
          <div className="d-flex justify-content-between small text-muted-bl">
            <span>Total</span>
            <span className="fw-semibold" style={{ color: 'var(--bl-text)' }}>{formatMoney(totalValue)}</span>
          </div>
          <div className="d-flex justify-content-between small text-muted-bl">
            <span>Custo estimado</span>
            <span className="fw-semibold">{formatMoney(totalCostEstimate)}</span>
          </div>
        </div>

        <button type="button" className="btn btn-primary btn-lg fw-semibold" disabled={saving || cart.length === 0} onClick={handleSubmit}>
          {saving ? 'Salvando…' : isNew ? 'Criar pedido' : 'Salvar alterações'}
        </button>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar pedido?"
        description="O pedido será marcado como cancelado. Essa ação pode ser revertida editando o status depois."
        confirmLabel="Cancelar pedido"
        danger
        onCancel={() => setConfirmCancel(false)}
        onConfirm={async () => {
          await handleStatusChange('cancelado')
          setConfirmCancel(false)
        }}
      />
    </div>
  )
}
