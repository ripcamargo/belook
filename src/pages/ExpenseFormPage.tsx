import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { MoneyInput } from '../components/MoneyInput'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAuth } from '../hooks/useAuth'
import { createExpense, deleteExpense, getExpense, updateExpense } from '../services/expenseService'
import type { Expense, ExpenseCategory } from '../types'
import { EXPENSE_CATEGORY_LABELS } from '../utils/constants'

function dateToInputValue(millis: number): string {
  return new Date(millis).toISOString().slice(0, 10)
}

function inputValueToDate(value: string): number {
  return new Date(`${value}T12:00:00`).getTime()
}

export function ExpenseFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { businessId } = useAuth()

  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(!isNew)

  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('outros')
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(() => dateToInputValue(Date.now()))
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (isNew || !businessId || !id) return
    setLoading(true)
    getExpense(businessId, id).then((e) => {
      if (e) {
        setExpense(e)
        setDescription(e.description)
        setCategory(e.category)
        setAmount(e.amount)
        setDate(dateToInputValue(e.date))
        setNote(e.note ?? '')
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
      const input = { description, category, amount, date: inputValueToDate(date), note }
      if (isNew) {
        await createExpense(businessId, input)
      } else if (expense) {
        await updateExpense(businessId, expense.id, input)
      }
      navigate('/expenses', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bl-page">
      <PageHeader title={isNew ? 'Nova despesa' : 'Editar despesa'} back />

      <form onSubmit={handleSubmit} className="bl-card p-4 d-flex flex-column gap-3">
        {error && (
          <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
            {error}
          </div>
        )}

        <div>
          <label className="form-label small fw-semibold">Descrição</label>
          <input
            type="text"
            required
            className="form-control"
            placeholder="Frete dos correios"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label className="form-label small fw-semibold">Categoria</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6">
            <label className="form-label small fw-semibold">Valor</label>
            <MoneyInput value={amount} onChange={setAmount} />
          </div>
        </div>

        <div>
          <label className="form-label small fw-semibold">Data</label>
          <input type="date" required className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <label className="form-label small fw-semibold">Observação (opcional)</label>
          <textarea className="form-control" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary btn-lg fw-semibold" disabled={saving}>
          {saving ? 'Salvando…' : isNew ? 'Registrar despesa' : 'Salvar alterações'}
        </button>

        {!isNew && (
          <button type="button" className="btn fw-semibold" style={{ color: 'var(--bl-danger)' }} onClick={() => setConfirmDelete(true)}>
            Excluir despesa
          </button>
        )}
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir despesa?"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (!businessId || !expense) return
          await deleteExpense(businessId, expense.id)
          setConfirmDelete(false)
          navigate('/expenses', { replace: true })
        }}
      />
    </div>
  )
}
