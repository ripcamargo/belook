import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { getBusiness, updateBusinessName } from '../services/businessService'

const MENU_ITEMS = [
  { to: '/sales', icon: 'bi-cart3', label: 'Vendas' },
  { to: '/products', icon: 'bi-tag', label: 'Produtos' },
  { to: '/components', icon: 'bi-stars', label: 'Insumos' },
  { to: '/costs', icon: 'bi-calculator', label: 'Fichas de custo' },
  { to: '/production', icon: 'bi-gear-wide-connected', label: 'Produção' },
  { to: '/customers', icon: 'bi-people', label: 'Clientes' },
  { to: '/suppliers', icon: 'bi-truck', label: 'Fornecedores' },
  { to: '/expenses', icon: 'bi-receipt', label: 'Despesas' },
  { to: '/settings', icon: 'bi-gear', label: 'Configurações' },
]

export function MorePage() {
  const { user, businessId, logout, updateDisplayName } = useAuth()

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(user?.displayName ?? '')
  }, [user])

  useEffect(() => {
    if (!businessId) return
    getBusiness(businessId).then((business) => {
      setCompany(business?.name ?? '')
      setLoaded(true)
    })
  }, [businessId])

  function startEditing() {
    setError(null)
    setEditing(true)
  }

  function cancelEditing() {
    setError(null)
    setName(user?.displayName ?? '')
    if (businessId) getBusiness(businessId).then((business) => setCompany(business?.name ?? ''))
    setEditing(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!businessId) return
    setError(null)
    setSaving(true)
    try {
      await Promise.all([updateDisplayName(name), updateBusinessName(businessId, company)])
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bl-page">
      <PageHeader title="Mais" />

      <div className="bl-card mb-3 overflow-hidden">
        {MENU_ITEMS.map((item, index) => (
          <Link
            key={item.to}
            to={item.to}
            className="d-flex align-items-center gap-3 px-3 py-3 text-decoration-none"
            style={{
              color: 'var(--bl-text)',
              borderTop: index === 0 ? 'none' : '1px solid var(--bl-border)',
            }}
          >
            <span
              className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
              style={{ width: 36, height: 36, background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }}
            >
              <i className={`bi ${item.icon}`} />
            </span>
            <span className="fw-semibold flex-fill">{item.label}</span>
            <i className="bi bi-chevron-right text-muted-bl" />
          </Link>
        ))}
      </div>

      <div className="bl-card overflow-hidden">
        {editing ? (
          <form onSubmit={handleSubmit} className="p-4 d-flex flex-column gap-3">
            <h2 className="h6 fw-bold mb-0">Editar conta</h2>

            {error && (
              <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="form-label small fw-semibold">Nome</label>
              <input
                type="text"
                className="form-control"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label small fw-semibold">Empresa</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nome da sua marca"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label small fw-semibold">E-mail</label>
              <input type="email" className="form-control" value={user?.email ?? ''} disabled />
              <p className="small text-muted-bl mb-0 mt-1">Usado para entrar na conta.</p>
            </div>

            <div className="d-flex gap-2">
              <button type="button" className="btn flex-fill" style={{ background: 'var(--bl-surface-2)' }} onClick={cancelEditing} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary fw-semibold flex-fill" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="d-flex align-items-center gap-3 p-4">
              <span
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold"
                style={{ width: 44, height: 44, background: 'var(--bl-primary-light)', color: 'var(--bl-primary)' }}
              >
                {(name || user?.email || '?').charAt(0).toUpperCase()}
              </span>
              <span className="flex-fill min-width-0">
                <span className="d-block fw-semibold text-truncate">{name || 'Adicionar nome'}</span>
                <span className="d-block small text-muted-bl text-truncate">{company || 'Adicionar empresa'}</span>
                <span className="d-block small text-muted-bl text-truncate">{user?.email}</span>
              </span>
              <button
                type="button"
                className="btn btn-sm fw-semibold flex-shrink-0"
                style={{ color: 'var(--bl-primary)' }}
                onClick={startEditing}
                disabled={!loaded}
              >
                Editar
              </button>
            </div>

            <button
              type="button"
              className="d-flex align-items-center gap-3 px-4 py-3 border-0 w-100 text-start"
              style={{ borderTop: '1px solid var(--bl-border)', background: 'transparent', color: 'var(--bl-danger)' }}
              onClick={() => logout()}
            >
              <span
                className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: 36, height: 36, background: 'var(--bl-danger-light)' }}
              >
                <i className="bi bi-box-arrow-right" />
              </span>
              <span className="fw-semibold flex-fill">Sair da conta</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
