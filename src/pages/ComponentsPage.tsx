import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { StockBadge } from '../components/StockBadge'
import { useAuth } from '../hooks/useAuth'
import { listComponents } from '../services/componentService'
import type { Component } from '../types'
import { formatMoney } from '../utils/money'

export function ComponentsPage() {
  const { businessId } = useAuth()
  const [components, setComponents] = useState<Component[] | null>(null)

  useEffect(() => {
    if (!businessId) return
    listComponents(businessId).then(setComponents)
  }, [businessId])

  if (!components) return <LoadingScreen />

  const active = components.filter((c) => c.active)

  return (
    <div className="bl-page">
      <PageHeader
        title="Insumos"
        action={
          <Link to="/components/new" className="btn btn-primary btn-sm fw-semibold">
            <i className="bi bi-plus-lg me-1" />
            Novo
          </Link>
        }
      />

      {active.length === 0 ? (
        <div className="bl-card p-4">
          <EmptyState
            icon="bi-stars"
            title="Nenhum insumo cadastrado"
            description="Cadastre DTF, embalagens, etiquetas e outros itens usados na produção."
            action={
              <Link to="/components/new" className="btn btn-primary fw-semibold px-4">
                Cadastrar insumo
              </Link>
            }
          />
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {active.map((c) => (
            <Link
              key={c.id}
              to={`/components/${c.id}`}
              className="bl-card p-3 d-flex align-items-center gap-3 text-decoration-none"
              style={{ color: 'var(--bl-text)' }}
            >
              <span
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: 44, height: 44, background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }}
              >
                <i className="bi bi-stars fs-5" />
              </span>
              <span className="flex-fill min-width-0">
                <span className="d-block fw-semibold text-truncate">{c.name}</span>
                <span className="d-block small text-muted-bl">
                  {formatMoney(c.unitCost)} / {c.unit}
                </span>
              </span>
              <StockBadge stock={c.stock} minStock={c.minStock} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
