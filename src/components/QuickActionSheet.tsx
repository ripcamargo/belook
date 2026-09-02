import { useNavigate } from 'react-router-dom'

interface QuickActionSheetProps {
  open: boolean
  onClose: () => void
}

interface QuickAction {
  icon: string
  label: string
  description: string
  to: string
  tone: 'success' | 'danger' | 'primary' | 'info'
}

const ACTIONS: QuickAction[] = [
  {
    icon: 'bi-box-arrow-in-down',
    label: 'Registrar entrada',
    description: 'Adicionar itens ao estoque',
    to: '/inventory/movement?type=entrada',
    tone: 'success',
  },
  {
    icon: 'bi-box-arrow-up',
    label: 'Registrar saída',
    description: 'Baixar itens do estoque',
    to: '/inventory/movement?type=saida',
    tone: 'danger',
  },
  {
    icon: 'bi-cart-plus',
    label: 'Nova venda',
    description: 'Registrar uma venda',
    to: '/sales/new',
    tone: 'primary',
  },
  {
    icon: 'bi-clipboard-plus',
    label: 'Novo pedido',
    description: 'Criar um pedido personalizado',
    to: '/orders/new',
    tone: 'info',
  },
  {
    icon: 'bi-gear-wide-connected',
    label: 'Registrar produção',
    description: 'Dar entrada em peças produzidas',
    to: '/production',
    tone: 'success',
  },
]

const TONE_STYLES: Record<QuickAction['tone'], { bg: string; color: string }> = {
  success: { bg: 'var(--bl-success-light)', color: 'var(--bl-success)' },
  danger: { bg: 'var(--bl-danger-light)', color: 'var(--bl-danger)' },
  primary: { bg: 'var(--bl-primary-light)', color: 'var(--bl-primary)' },
  info: { bg: '#e6f0ff', color: 'var(--bl-info)' },
}

export function QuickActionSheet({ open, onClose }: QuickActionSheetProps) {
  const navigate = useNavigate()

  if (!open) return null

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-end"
      style={{ background: 'rgba(15,15,25,0.45)', zIndex: 1050 }}
      onClick={onClose}
    >
      <div
        className="bl-card mx-auto w-100 p-3"
        style={{
          maxWidth: 480,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          paddingBottom: 'calc(1rem + var(--bl-safe-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3" style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--bl-border)' }} />
        <h2 className="h6 fw-bold mb-3 px-1">Ação rápida</h2>
        <div className="d-flex flex-column gap-2">
          {ACTIONS.map((action) => {
            const style = TONE_STYLES[action.tone]
            return (
              <button
                key={action.label}
                type="button"
                className="btn d-flex align-items-center gap-3 text-start p-2 border-0"
                onClick={() => {
                  onClose()
                  navigate(action.to)
                }}
              >
                <span
                  className="d-flex align-items-center justify-content-center rounded-4 flex-shrink-0"
                  style={{ width: 44, height: 44, background: style.bg, color: style.color, fontSize: '1.2rem' }}
                >
                  <i className={`bi ${action.icon}`} />
                </span>
                <span>
                  <span className="d-block fw-semibold" style={{ color: 'var(--bl-text)' }}>
                    {action.label}
                  </span>
                  <span className="d-block small text-muted-bl">{action.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
