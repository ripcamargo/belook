import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import { listCustomers } from '../services/customerService'
import type { Customer } from '../types'

export function CustomersPage() {
  const { businessId } = useAuth()
  const [customers, setCustomers] = useState<Customer[] | null>(null)

  useEffect(() => {
    if (!businessId) return
    listCustomers(businessId).then(setCustomers)
  }, [businessId])

  if (!customers) return <LoadingScreen />

  const active = customers.filter((c) => c.active)

  return (
    <div className="bl-page">
      <PageHeader
        title="Clientes"
        action={
          <Link to="/customers/new" className="btn btn-primary btn-sm fw-semibold">
            <i className="bi bi-plus-lg me-1" />
            Novo
          </Link>
        }
      />

      {active.length === 0 ? (
        <div className="bl-card p-4">
          <EmptyState
            icon="bi-people"
            title="Nenhum cliente cadastrado"
            description="Cadastre seus clientes para agilizar o registro de vendas."
            action={
              <Link to="/customers/new" className="btn btn-primary fw-semibold px-4">
                Cadastrar cliente
              </Link>
            }
          />
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {active.map((c) => (
            <Link
              key={c.id}
              to={`/customers/${c.id}`}
              className="bl-card p-3 d-flex align-items-center gap-3 text-decoration-none"
              style={{ color: 'var(--bl-text)' }}
            >
              <span
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold"
                style={{ width: 44, height: 44, background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }}
              >
                {c.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-fill min-width-0">
                <span className="d-block fw-semibold text-truncate">{c.name}</span>
                <span className="d-block small text-muted-bl text-truncate">{c.phone || c.email || 'Sem contato'}</span>
              </span>
              <i className="bi bi-chevron-right text-muted-bl" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
