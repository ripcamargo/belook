import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = 'bi-inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="d-flex flex-column align-items-center text-center py-5 px-3">
      <div
        className="d-flex align-items-center justify-content-center rounded-4 mb-3"
        style={{ width: 64, height: 64, background: 'var(--bl-primary-light)', color: 'var(--bl-primary)', fontSize: '1.75rem' }}
      >
        <i className={`bi ${icon}`} />
      </div>
      <h2 className="h6 fw-bold mb-1">{title}</h2>
      {description && <p className="small text-muted-bl mb-3" style={{ maxWidth: 320 }}>{description}</p>}
      {action}
    </div>
  )
}
