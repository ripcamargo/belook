import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAuth } from '../hooks/useAuth'
import { createCustomer, getCustomer, setCustomerActive, updateCustomer } from '../services/customerService'
import type { Customer } from '../types'

export function CustomerFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { businessId } = useAuth()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(!isNew)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  useEffect(() => {
    if (isNew || !businessId || !id) return
    setLoading(true)
    getCustomer(businessId, id).then((c) => {
      if (c) {
        setCustomer(c)
        setName(c.name)
        setPhone(c.phone ?? '')
        setEmail(c.email ?? '')
        setNote(c.note ?? '')
      }
      setLoading(false)
    })
  }, [businessId, id, isNew])

  if (loading) return <LoadingScreen />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setError(null)
    setSaving(true)
    try {
      const input = { name, phone, email, note }
      if (isNew) {
        const newId = await createCustomer(businessId, input)
        navigate(`/customers/${newId}`, { replace: true })
      } else if (customer) {
        await updateCustomer(businessId, customer.id, input)
        navigate('/customers')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bl-page">
      <PageHeader title={isNew ? 'Novo cliente' : customer?.name ?? 'Cliente'} back />

      <form onSubmit={handleSubmit} className="bl-card p-4 d-flex flex-column gap-3">
        {error && (
          <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
            {error}
          </div>
        )}

        <div>
          <label className="form-label small fw-semibold">Nome</label>
          <input
            type="text"
            required
            className="form-control"
            placeholder="Nome do cliente"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label small fw-semibold">Telefone (opcional)</label>
          <input
            type="tel"
            className="form-control"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label small fw-semibold">E-mail (opcional)</label>
          <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="form-label small fw-semibold">Observação (opcional)</label>
          <textarea className="form-control" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary btn-lg fw-semibold" disabled={saving}>
          {saving ? 'Salvando…' : isNew ? 'Criar cliente' : 'Salvar alterações'}
        </button>

        {!isNew && (
          <button type="button" className="btn fw-semibold" style={{ color: 'var(--bl-danger)' }} onClick={() => setConfirmDeactivate(true)}>
            Desativar cliente
          </button>
        )}
      </form>

      <ConfirmDialog
        open={confirmDeactivate}
        title="Desativar cliente?"
        description="Ele deixará de aparecer nas listas, mas o histórico de vendas é preservado."
        confirmLabel="Desativar"
        danger
        onCancel={() => setConfirmDeactivate(false)}
        onConfirm={async () => {
          if (!businessId || !customer) return
          await setCustomerActive(businessId, customer.id, false)
          setConfirmDeactivate(false)
          navigate('/customers', { replace: true })
        }}
      />
    </div>
  )
}
