import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { MoneyInput } from '../components/MoneyInput'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAuth } from '../hooks/useAuth'
import { createComponent, getComponent, setComponentActive, updateComponent } from '../services/componentService'
import type { Component } from '../types'
import { COMPONENT_CATEGORY_SUGGESTIONS, UNIT_SUGGESTIONS } from '../utils/constants'

export function ComponentFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { businessId, user } = useAuth()

  const [component, setComponent] = useState<Component | null>(null)
  const [loading, setLoading] = useState(!isNew)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('unidade')
  const [unitCost, setUnitCost] = useState(0)
  const [minStock, setMinStock] = useState(5)
  const [initialStock, setInitialStock] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  useEffect(() => {
    if (isNew || !businessId || !id) return
    setLoading(true)
    getComponent(businessId, id).then((c) => {
      if (c) {
        setComponent(c)
        setName(c.name)
        setCategory(c.category ?? '')
        setUnit(c.unit)
        setUnitCost(c.unitCost)
        setMinStock(c.minStock)
      }
      setLoading(false)
    })
  }, [businessId, id, isNew])

  if (loading) return <LoadingScreen />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!businessId || !user) return
    setError(null)
    setSaving(true)
    try {
      const input = { name, category: category.trim() || null, unit, unitCost, minStock }
      if (isNew) {
        const newId = await createComponent(businessId, user.uid, { ...input, initialStock })
        navigate(`/components/${newId}`, { replace: true })
      } else if (component) {
        await updateComponent(businessId, component.id, input)
        navigate('/components')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bl-page">
      <PageHeader title={isNew ? 'Novo insumo' : component?.name ?? 'Insumo'} back />

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
            placeholder="DTF Frente"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label small fw-semibold">Categoria</label>
          <input
            type="text"
            className="form-control"
            list="component-category-suggestions"
            placeholder="Estampas"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <datalist id="component-category-suggestions">
            {COMPONENT_CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label className="form-label small fw-semibold">Custo unitário</label>
            <MoneyInput value={unitCost} onChange={setUnitCost} />
          </div>
          <div className="col-6">
            <label className="form-label small fw-semibold">Unidade</label>
            <input
              type="text"
              className="form-control"
              list="unit-suggestions"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
            <datalist id="unit-suggestions">
              {UNIT_SUGGESTIONS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="form-label small fw-semibold">Estoque mínimo</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            className="form-control"
            value={minStock}
            onChange={(e) => setMinStock(Number(e.target.value) || 0)}
          />
        </div>

        {isNew && (
          <div>
            <label className="form-label small fw-semibold">Estoque inicial (opcional)</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              className="form-control"
              value={initialStock}
              onChange={(e) => setInitialStock(Number(e.target.value) || 0)}
            />
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg fw-semibold" disabled={saving}>
          {saving ? 'Salvando…' : isNew ? 'Criar insumo' : 'Salvar alterações'}
        </button>

        {!isNew && (
          <button type="button" className="btn fw-semibold" style={{ color: 'var(--bl-danger)' }} onClick={() => setConfirmDeactivate(true)}>
            Desativar insumo
          </button>
        )}
      </form>

      <ConfirmDialog
        open={confirmDeactivate}
        title="Desativar insumo?"
        description="Ele deixará de aparecer nas listas, mas o histórico é preservado."
        confirmLabel="Desativar"
        danger
        onCancel={() => setConfirmDeactivate(false)}
        onConfirm={async () => {
          if (!businessId || !component) return
          await setComponentActive(businessId, component.id, false)
          setConfirmDeactivate(false)
          navigate('/components', { replace: true })
        }}
      />
    </div>
  )
}
