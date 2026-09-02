import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import { listExpenses } from '../services/expenseService'
import type { Expense } from '../types'
import { EXPENSE_CATEGORY_LABELS } from '../utils/constants'
import { formatDateShort } from '../utils/format'
import { formatMoney, sumCents } from '../utils/money'

export function ExpensesPage() {
  const { businessId } = useAuth()
  const [expenses, setExpenses] = useState<Expense[] | null>(null)

  useEffect(() => {
    if (!businessId) return
    listExpenses(businessId).then(setExpenses)
  }, [businessId])

  if (!expenses) return <LoadingScreen />

  const total = sumCents(expenses.map((e) => e.amount))

  const groups = new Map<string, Expense[]>()
  for (const expense of expenses) {
    const key = formatDateShort(expense.date)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(expense)
  }

  return (
    <div className="bl-page">
      <PageHeader
        title="Despesas"
        action={
          <Link to="/expenses/new" className="btn btn-primary btn-sm fw-semibold">
            <i className="bi bi-plus-lg me-1" />
            Nova
          </Link>
        }
      />

      {expenses.length === 0 ? (
        <div className="bl-card p-4">
          <EmptyState
            icon="bi-receipt"
            title="Nenhuma despesa registrada"
            description="Registre frete, marketing, embalagens e outros custos do negócio."
            action={
              <Link to="/expenses/new" className="btn btn-primary fw-semibold px-4">
                Registrar despesa
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="bl-card p-3 d-flex align-items-center justify-content-between mb-3">
            <span className="small text-muted-bl">Total registrado</span>
            <span className="fw-bold">{formatMoney(total)}</span>
          </div>

          <div className="d-flex flex-column gap-4">
            {[...groups.entries()].map(([date, items]) => (
              <div key={date}>
                <p className="small fw-bold text-muted-bl mb-2">{date}</p>
                <div className="d-flex flex-column gap-2">
                  {items.map((e) => (
                    <Link
                      key={e.id}
                      to={`/expenses/${e.id}`}
                      className="bl-card p-3 d-flex align-items-center gap-3 text-decoration-none"
                      style={{ color: 'var(--bl-text)' }}
                    >
                      <span
                        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{ width: 40, height: 40, background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}
                      >
                        <i className="bi bi-receipt" />
                      </span>
                      <span className="flex-fill min-width-0">
                        <span className="d-block fw-semibold text-truncate">{e.description}</span>
                        <span className="d-block small text-muted-bl">{EXPENSE_CATEGORY_LABELS[e.category]}</span>
                      </span>
                      <span className="fw-semibold flex-shrink-0">{formatMoney(e.amount)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
