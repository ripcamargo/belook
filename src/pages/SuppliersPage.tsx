import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import { listSuppliers } from '../services/supplierService'
import type { Supplier } from '../types'

export function SuppliersPage() {
  const { businessId } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null)

  useEffect(() => {
    if (!businessId) return
    listSuppliers(businessId).then(setSuppliers)
  }, [businessId])

  if (!suppliers) return <LoadingScreen />

  const active = suppliers.filter((s) => s.active)

  return (
    <div className="bl-page">
      <PageHeader
        title="Fornecedores"
        action={
          <Link to="/suppliers/new" className="btn btn-primary btn-sm fw-semibold">
            <i className="bi bi-plus-lg me-1" />
            Novo
          </Link>
        }
      />

      {active.length === 0 ? (
        <div className="bl-card p-4">
          <EmptyState
            icon="bi-truck"
            title="Nenhum fornecedor cadastrado"
            description="Cadastre seus fornecedores para agilizar o registro de entradas de estoque."
            action={
              <Link to="/suppliers/new" className="btn btn-primary fw-semibold px-4">
                Cadastrar fornecedor
              </Link>
            }
          />
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {active.map((s) => (
            <Link
              key={s.id}
              to={`/suppliers/${s.id}`}
              className="bl-card p-3 d-flex align-items-center gap-3 text-decoration-none"
              style={{ color: 'var(--bl-text)' }}
            >
              <span
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: 44, height: 44, background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }}
              >
                <i className="bi bi-truck fs-5" />
              </span>
              <span className="flex-fill min-width-0">
                <span className="d-block fw-semibold text-truncate">{s.name}</span>
                <span className="d-block small text-muted-bl text-truncate">{s.contact || 'Sem contato'}</span>
              </span>
              <i className="bi bi-chevron-right text-muted-bl" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
