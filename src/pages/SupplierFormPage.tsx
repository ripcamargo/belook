import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAuth } from '../hooks/useAuth'
import { createSupplier, getSupplier, setSupplierActive, updateSupplier } from '../services/supplierService'
import type { Supplier } from '../types'

export function SupplierFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { businessId } = useAuth()

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(!isNew)

  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  useEffect(() => {
    if (isNew || !businessId || !id) return
    setLoading(true)
    getSupplier(businessId, id).then((s) => {
      if (s) {
        setSupplier(s)
        setName(s.name)
        setContact(s.contact ?? '')
        setNote(s.note ?? '')
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
      const input = { name, contact, note }
      if (isNew) {
        const newId = await createSupplier(businessId, input)
        navigate(`/suppliers/${newId}`, { replace: true })
      } else if (supplier) {
        await updateSupplier(businessId, supplier.id, input)
        navigate('/suppliers')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bl-page">
      <PageHeader title={isNew ? 'Novo fornecedor' : supplier?.name ?? 'Fornecedor'} back />

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
            placeholder="Nome do fornecedor"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label small fw-semibold">Contato (opcional)</label>
          <input
            type="text"
            className="form-control"
            placeholder="Telefone, e-mail ou @"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label small fw-semibold">Observação (opcional)</label>
          <textarea className="form-control" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary btn-lg fw-semibold" disabled={saving}>
          {saving ? 'Salvando…' : isNew ? 'Criar fornecedor' : 'Salvar alterações'}
        </button>

        {!isNew && (
          <button type="button" className="btn fw-semibold" style={{ color: 'var(--bl-danger)' }} onClick={() => setConfirmDeactivate(true)}>
            Desativar fornecedor
          </button>
        )}
      </form>

      <ConfirmDialog
        open={confirmDeactivate}
        title="Desativar fornecedor?"
        description="Ele deixará de aparecer nas listas, mas o histórico é preservado."
        confirmLabel="Desativar"
        danger
        onCancel={() => setConfirmDeactivate(false)}
        onConfirm={async () => {
          if (!businessId || !supplier) return
          await setSupplierActive(businessId, supplier.id, false)
          setConfirmDeactivate(false)
          navigate('/suppliers', { replace: true })
        }}
      />
    </div>
  )
}
