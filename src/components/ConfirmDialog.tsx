interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
      style={{ background: 'rgba(15,15,25,0.45)', zIndex: 1060 }}
      onClick={onCancel}
    >
      <div className="bl-card p-4 w-100" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <h2 className="h6 fw-bold mb-2">{title}</h2>
        {description && <p className="small text-muted-bl mb-4">{description}</p>}
        <div className="d-flex gap-2">
          <button type="button" className="btn flex-fill" style={{ background: 'var(--bl-surface-2)' }} onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn flex-fill fw-semibold text-white"
            style={{ background: danger ? 'var(--bl-danger)' : 'var(--bl-primary)' }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
