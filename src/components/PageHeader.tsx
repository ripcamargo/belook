import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  action?: ReactNode
}

export function PageHeader({ title, subtitle, back, action }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="d-flex align-items-center justify-content-between gap-2 mb-3 pt-2">
      <div className="d-flex align-items-center gap-2 min-width-0">
        {back && (
          <button
            type="button"
            className="btn btn-sm p-0 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bl-surface-2)' }}
            onClick={() => navigate(-1)}
            aria-label="Voltar"
          >
            <i className="bi bi-chevron-left" />
          </button>
        )}
        <div className="min-width-0">
          <h1 className="h5 fw-bold mb-0 text-truncate">{title}</h1>
          {subtitle && <p className="small text-muted-bl mb-0 text-truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  )
}
