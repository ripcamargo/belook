import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import { listRecentSales } from '../services/salesService'
import { listExpenses } from '../services/expenseService'
import type { Expense, Sale } from '../types'
import { formatMoney, sumCents } from '../utils/money'

type Period = '30d' | 'month' | 'all'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'month', label: 'Este mês' },
  { value: '30d', label: '30 dias' },
  { value: 'all', label: 'Tudo' },
]

function periodStart(period: Period): number {
  const now = new Date()
  if (period === 'all') return 0
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  return now.getTime() - 30 * 24 * 60 * 60 * 1000
}

export function FinancePage() {
  const { businessId } = useAuth()
  const [sales, setSales] = useState<Sale[] | null>(null)
  const [expenses, setExpenses] = useState<Expense[] | null>(null)
  const [period, setPeriod] = useState<Period>('month')

  useEffect(() => {
    if (!businessId) return
    Promise.all([listRecentSales(businessId, 500), listExpenses(businessId)]).then(([s, e]) => {
      setSales(s)
      setExpenses(e)
    })
  }, [businessId])

  if (!sales || !expenses) return <LoadingScreen />

  const since = periodStart(period)
  const periodSales = sales.filter((s) => s.soldAt >= since)
  const periodExpenses = expenses.filter((e) => e.date >= since)

  const revenue = sumCents(periodSales.map((s) => s.totalRevenue))
  const cost = sumCents(periodSales.map((s) => s.totalCost))
  const grossProfit = revenue - cost
  const expensesTotal = sumCents(periodExpenses.map((e) => e.amount))
  const netProfit = grossProfit - expensesTotal

  return (
    <div className="bl-page">
      <PageHeader title="Financeiro" />

      <div className="btn-group w-100 mb-3" role="group">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="btn btn-sm fw-semibold"
            style={{
              background: period === opt.value ? 'var(--bl-primary-light)' : 'transparent',
              color: period === opt.value ? 'var(--bl-primary)' : 'var(--bl-text-muted)',
              border: '1px solid var(--bl-border)',
            }}
            onClick={() => setPeriod(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="row g-2 mb-3">
        <div className="col-6">
          <div className="bl-card p-3">
            <span className="d-block small text-muted-bl">Receita</span>
            <span className="d-block h5 fw-bold mb-0">{formatMoney(revenue)}</span>
          </div>
        </div>
        <div className="col-6">
          <div className="bl-card p-3">
            <span className="d-block small text-muted-bl">Custo dos produtos</span>
            <span className="d-block h5 fw-bold mb-0">{formatMoney(cost)}</span>
          </div>
        </div>
        <div className="col-6">
          <div className="bl-card p-3">
            <span className="d-block small text-muted-bl">Lucro bruto</span>
            <span className="d-block h5 fw-bold mb-0" style={{ color: grossProfit >= 0 ? 'var(--bl-success)' : 'var(--bl-danger)' }}>
              {formatMoney(grossProfit)}
            </span>
          </div>
        </div>
        <div className="col-6">
          <div className="bl-card p-3">
            <span className="d-block small text-muted-bl">Despesas</span>
            <span className="d-block h5 fw-bold mb-0">{formatMoney(expensesTotal)}</span>
          </div>
        </div>
      </div>

      <div className="bl-card p-4 d-flex align-items-center justify-content-between mb-3">
        <span className="fw-semibold">Lucro líquido</span>
        <span className="h5 fw-bold mb-0" style={{ color: netProfit >= 0 ? 'var(--bl-success)' : 'var(--bl-danger)' }}>
          {formatMoney(netProfit)}
        </span>
      </div>

      <div className="d-flex gap-2">
        <Link to="/sales" className="btn flex-fill fw-semibold" style={{ background: 'var(--bl-surface-2)' }}>
          Ver vendas
        </Link>
        <Link to="/expenses" className="btn flex-fill fw-semibold" style={{ background: 'var(--bl-surface-2)' }}>
          Ver despesas
        </Link>
      </div>
    </div>
  )
}
