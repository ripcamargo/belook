import { useEffect, useState, type FormEvent } from 'react'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { MoneyInput } from '../components/MoneyInput'
import { useAuth } from '../hooks/useAuth'
import { getBusiness, updateBusinessSettings } from '../services/businessService'
import type { Business } from '../types'
import { applyTheme } from '../utils/theme'
import { formatMoney } from '../utils/money'

const THEME_OPTIONS: { value: Business['theme']; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
]

/** Campos de percentual ficam na UI como número inteiro (5 = 5%) e viram fração (0.05) só ao salvar. */
function fractionToPercentInput(fraction: number): string {
  return String(Math.round(fraction * 100))
}

function percentInputToFraction(value: string): number {
  return (Number(value) || 0) / 100
}

export function SettingsPage() {
  const { businessId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [allowNegativeStock, setAllowNegativeStock] = useState(false)
  const [theme, setTheme] = useState<Business['theme']>('system')
  const [laborRatePerHour, setLaborRatePerHour] = useState(0)
  const [monthlyOverhead, setMonthlyOverhead] = useState(0)
  const [estimatedMonthlyProduction, setEstimatedMonthlyProduction] = useState('0')
  const [paymentFeePercent, setPaymentFeePercent] = useState('0')
  const [defaultTargetMargin, setDefaultTargetMargin] = useState('40')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!businessId) return
    getBusiness(businessId).then((business) => {
      setAllowNegativeStock(business?.allowNegativeStock ?? false)
      setTheme(business?.theme ?? 'system')
      setLaborRatePerHour(business?.laborRatePerHour ?? 0)
      setMonthlyOverhead(business?.monthlyOverhead ?? 0)
      setEstimatedMonthlyProduction(String(business?.estimatedMonthlyProduction ?? 0))
      setPaymentFeePercent(fractionToPercentInput(business?.paymentFeePercent ?? 0))
      setDefaultTargetMargin(fractionToPercentInput(business?.defaultTargetMargin ?? 0.4))
      setLoading(false)
    })
  }, [businessId])

  if (loading) return <LoadingScreen />

  const overheadPerUnitPreview =
    Number(estimatedMonthlyProduction) > 0 ? Math.round(monthlyOverhead / Number(estimatedMonthlyProduction)) : 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setSaving(true)
    setSuccess(false)
    try {
      await updateBusinessSettings(businessId, {
        allowNegativeStock,
        theme,
        laborRatePerHour,
        monthlyOverhead,
        estimatedMonthlyProduction: Number(estimatedMonthlyProduction) || 0,
        paymentFeePercent: percentInputToFraction(paymentFeePercent),
        defaultTargetMargin: percentInputToFraction(defaultTargetMargin),
      })
      applyTheme(theme)
      setSuccess(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bl-page">
      <PageHeader title="Configurações" back />

      <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
        {success && (
          <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-success-light)', color: 'var(--bl-success)' }}>
            Configurações salvas.
          </div>
        )}

        <div className="bl-card p-4 d-flex flex-column gap-3">
          <div>
            <label className="form-label small fw-semibold">Aparência</label>
            <div className="btn-group w-100" role="group">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="btn btn-sm fw-semibold"
                  style={{
                    background: theme === opt.value ? 'var(--bl-primary-light)' : 'transparent',
                    color: theme === opt.value ? 'var(--bl-primary)' : 'var(--bl-text-muted)',
                    border: '1px solid var(--bl-border)',
                  }}
                  onClick={() => setTheme(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between gap-3 pt-2" style={{ borderTop: '1px solid var(--bl-border)' }}>
            <span>
              <span className="d-block fw-semibold">Permitir estoque negativo</span>
              <span className="d-block small text-muted-bl">Deixa registrar vendas e saídas mesmo sem saldo suficiente.</span>
            </span>
            <div className="form-check form-switch flex-shrink-0">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                style={{ width: 42, height: 24 }}
                checked={allowNegativeStock}
                onChange={(e) => setAllowNegativeStock(e.target.checked)}
              />
            </div>
          </div>
        </div>

        <div className="bl-card p-4 d-flex flex-column gap-3">
          <h2 className="h6 fw-bold mb-0">Custos de produção</h2>
          <p className="small text-muted-bl mb-0 mt-n2">
            Usados na Ficha de custo de cada produto para calcular o custo completo (mão de obra + custo fixo) e sugerir preço de venda.
          </p>

          <div>
            <label className="form-label small fw-semibold">Valor da sua hora de trabalho</label>
            <MoneyInput value={laborRatePerHour} onChange={setLaborRatePerHour} />
          </div>

          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small fw-semibold">Custo fixo mensal</label>
              <MoneyInput value={monthlyOverhead} onChange={setMonthlyOverhead} />
              <p className="small text-muted-bl mb-0 mt-1">Energia, aluguel, depreciação de equipamento etc.</p>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Produção mensal estimada</label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className="form-control"
                value={estimatedMonthlyProduction}
                onChange={(e) => setEstimatedMonthlyProduction(e.target.value)}
              />
              <p className="small text-muted-bl mb-0 mt-1">Em unidades por mês.</p>
            </div>
          </div>

          {overheadPerUnitPreview > 0 && (
            <p className="small mb-0" style={{ color: 'var(--bl-primary)' }}>
              Isso adiciona {formatMoney(overheadPerUnitPreview)} de custo fixo em cada unidade.
            </p>
          )}

          <div className="row g-2 pt-2" style={{ borderTop: '1px solid var(--bl-border)' }}>
            <div className="col-6">
              <label className="form-label small fw-semibold">Taxa de pagamento (%)</label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                className="form-control"
                value={paymentFeePercent}
                onChange={(e) => setPaymentFeePercent(e.target.value)}
              />
              <p className="small text-muted-bl mb-0 mt-1">Cartão, maquininha ou marketplace.</p>
            </div>
            <div className="col-6">
              <label className="form-label small fw-semibold">Margem de lucro padrão (%)</label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                className="form-control"
                value={defaultTargetMargin}
                onChange={(e) => setDefaultTargetMargin(e.target.value)}
              />
              <p className="small text-muted-bl mb-0 mt-1">Usada para sugerir o preço de venda.</p>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg fw-semibold" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar configurações'}
        </button>
      </form>
    </div>
  )
}
