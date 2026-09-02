import { useEffect, useState, type FormEvent } from 'react'
import { MoneyInput } from './MoneyInput'
import { ColorDot } from './ColorDot'
import { COLOR_SUGGESTIONS, SIZE_SUGGESTIONS } from '../utils/constants'
import type { ProductVariant } from '../types'
import type { VariantInput } from '../services/productService'

interface VariantFormModalProps {
  open: boolean
  variant: ProductVariant | null
  onClose: () => void
  onSubmit: (input: VariantInput) => Promise<void>
}

const EMPTY: VariantInput = { color: '', size: '', sku: '', baseCost: 0, minStock: 5, initialStock: 0 }

export function VariantFormModal({ open, variant, onClose, onSubmit }: VariantFormModalProps) {
  const [form, setForm] = useState<VariantInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setForm(
      variant
        ? {
            color: variant.color,
            size: variant.size,
            sku: variant.sku ?? '',
            baseCost: variant.baseCost,
            minStock: variant.minStock,
          }
        : EMPTY,
    )
  }, [open, variant])

  if (!open) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.color.trim() || !form.size.trim()) {
      setError('Informe cor e tamanho.')
      return
    }
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-end"
      style={{ background: 'rgba(15,15,25,0.45)', zIndex: 1055 }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="bl-card mx-auto w-100 p-4 d-flex flex-column gap-3"
        style={{
          maxWidth: 480,
          maxHeight: '88dvh',
          overflowY: 'auto',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          paddingBottom: 'calc(1.5rem + var(--bl-safe-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="h6 fw-bold mb-0">{variant ? 'Editar variante' : 'Nova variante'}</h2>

        {error && (
          <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
            {error}
          </div>
        )}

        <div className="row g-2">
          <div className="col-6">
            <label className="form-label small fw-semibold">Cor</label>
            <div className="position-relative">
              {form.color.trim() && (
                <span className="position-absolute top-50 translate-middle-y" style={{ left: 12 }}>
                  <ColorDot color={form.color} />
                </span>
              )}
              <input
                type="text"
                className="form-control"
                style={form.color.trim() ? { paddingLeft: 34 } : undefined}
                list="color-suggestions"
                placeholder="Preto"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              />
            </div>
            <datalist id="color-suggestions">
              {COLOR_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="col-6">
            <label className="form-label small fw-semibold">Tamanho</label>
            <input
              type="text"
              className="form-control"
              list="size-suggestions"
              placeholder="G"
              value={form.size}
              onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
            />
            <datalist id="size-suggestions">
              {SIZE_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="form-label small fw-semibold">SKU (opcional)</label>
          <input
            type="text"
            className="form-control"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
          />
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label className="form-label small fw-semibold">Custo base</label>
            <MoneyInput value={form.baseCost} onChange={(cents) => setForm((f) => ({ ...f, baseCost: cents }))} />
          </div>
          <div className="col-6">
            <label className="form-label small fw-semibold">Estoque mínimo</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className="form-control"
              value={form.minStock}
              onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) || 0 }))}
            />
          </div>
        </div>

        {!variant && (
          <div>
            <label className="form-label small fw-semibold">Estoque inicial (opcional)</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className="form-control"
              value={form.initialStock}
              onChange={(e) => setForm((f) => ({ ...f, initialStock: Number(e.target.value) || 0 }))}
            />
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg fw-semibold mt-1" disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar variante'}
        </button>
      </form>
    </div>
  )
}
