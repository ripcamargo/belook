import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { MoneyInput } from '../components/MoneyInput'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ColorDot } from '../components/ColorDot'
import { useAuth } from '../hooks/useAuth'
import { createComponent, getComponent, setComponentActive, updateComponent } from '../services/componentService'
import type { Component } from '../types'
import { COLOR_SUGGESTIONS, COMPONENT_CATEGORY_SUGGESTIONS, SIZE_SUGGESTIONS, UNIT_SUGGESTIONS } from '../utils/constants'

interface DuplicateSnapshot {
  name: string
  category: string | null
  color: string | null
  size: string | null
  unit: string
  unitCost: number
  minStock: number
}

export function ComponentFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const location = useLocation()
  const { businessId, user } = useAuth()

  const duplicateFrom = isNew ? ((location.state as { duplicateFrom?: DuplicateSnapshot } | null)?.duplicateFrom ?? null) : null

  const [component, setComponent] = useState<Component | null>(null)
  const [loading, setLoading] = useState(!isNew)

  const [name, setName] = useState(duplicateFrom?.name ?? '')
  const [category, setCategory] = useState(duplicateFrom?.category ?? '')
  const [color, setColor] = useState(duplicateFrom?.color ?? '')
  const [size, setSize] = useState(duplicateFrom?.size ?? '')
  const [unit, setUnit] = useState(duplicateFrom?.unit ?? 'unidade')
  const [unitCost, setUnitCost] = useState(duplicateFrom?.unitCost ?? 0)
  const [minStock, setMinStock] = useState(duplicateFrom?.minStock ?? 5)
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
        setColor(c.color ?? '')
        setSize(c.size ?? '')
        setUnit(c.unit)
        setUnitCost(c.unitCost)
        setMinStock(c.minStock)
      }
      setLoading(false)
    })
  }, [businessId, id, isNew])

  // Reinicializa o formulário ao navegar de "editar" pra "novo" (ex.: via botão Duplicar) —
  // como a rota /components/:id reaproveita a mesma instância do componente, os useState
  // iniciais não rodam de novo sozinhos.
  useEffect(() => {
    if (!isNew) return
    const snapshot = (location.state as { duplicateFrom?: DuplicateSnapshot } | null)?.duplicateFrom ?? null
    setComponent(null)
    setName(snapshot?.name ?? '')
    setCategory(snapshot?.category ?? '')
    setColor(snapshot?.color ?? '')
    setSize(snapshot?.size ?? '')
    setUnit(snapshot?.unit ?? 'unidade')
    setUnitCost(snapshot?.unitCost ?? 0)
    setMinStock(snapshot?.minStock ?? 5)
    setInitialStock(0)
    setError(null)
  }, [isNew, location.key, location.state])

  if (loading) return <LoadingScreen />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!businessId || !user) return
    setError(null)
    setSaving(true)
    try {
      const input = {
        name,
        category: category.trim() || null,
        color: color.trim() || null,
        size: size.trim() || null,
        unit,
        unitCost,
        minStock,
      }
      if (isNew) {
        if (
          duplicateFrom &&
          input.name === duplicateFrom.name &&
          input.category === duplicateFrom.category &&
          input.color === duplicateFrom.color &&
          input.size === duplicateFrom.size &&
          input.unit === duplicateFrom.unit &&
          input.unitCost === duplicateFrom.unitCost &&
          input.minStock === duplicateFrom.minStock
        ) {
          setError('Altere pelo menos um campo (ex.: cor ou tamanho) — já existe um insumo idêntico a este.')
          setSaving(false)
          return
        }
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
        {duplicateFrom && (
          <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }}>
            Duplicando "{duplicateFrom.name}" — altere pelo menos um campo antes de salvar.
          </div>
        )}

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
            <label className="form-label small fw-semibold">Cor (opcional)</label>
            <div className="position-relative">
              {color.trim() && (
                <span className="position-absolute top-50 translate-middle-y" style={{ left: 12 }}>
                  <ColorDot color={color} />
                </span>
              )}
              <input
                type="text"
                className="form-control"
                style={color.trim() ? { paddingLeft: 34 } : undefined}
                list="component-color-suggestions"
                placeholder="Branca"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <datalist id="component-color-suggestions">
              {COLOR_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="col-6">
            <label className="form-label small fw-semibold">Tamanho (opcional)</label>
            <input
              type="text"
              className="form-control"
              list="component-size-suggestions"
              placeholder="M"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
            <datalist id="component-size-suggestions">
              {SIZE_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>
        <p className="small text-muted-bl mb-0" style={{ marginTop: -8 }}>
          Preencha só quando o insumo em si varia por cor/tamanho (ex.: camiseta lisa) — pra DTF, etiqueta, embalagem etc. deixe em branco.
        </p>

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

        {!isNew && component && (
          <button
            type="button"
            className="btn fw-semibold"
            style={{ color: 'var(--bl-primary)' }}
            onClick={() =>
              navigate('/components/new', {
                state: {
                  duplicateFrom: {
                    name: component.name,
                    category: component.category,
                    color: component.color,
                    size: component.size,
                    unit: component.unit,
                    unitCost: component.unitCost,
                    minStock: component.minStock,
                  } satisfies DuplicateSnapshot,
                },
              })
            }
          >
            <i className="bi bi-copy me-1" />
            Duplicar insumo
          </button>
        )}

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
