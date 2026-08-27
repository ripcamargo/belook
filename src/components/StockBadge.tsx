import { formatNumber } from '../utils/format'

interface StockBadgeProps {
  stock: number
  minStock: number
}

export function StockBadge({ stock, minStock }: StockBadgeProps) {
  const low = stock < minStock

  return (
    <span
      className="badge-bl"
      style={{
        background: low ? 'var(--bl-warning-light)' : 'var(--bl-surface-2)',
        color: low ? 'var(--bl-warning)' : 'var(--bl-text-muted)',
      }}
    >
      {low && <i className="bi bi-exclamation-triangle-fill" />}
      {formatNumber(stock)} em estoque
    </span>
  )
}
