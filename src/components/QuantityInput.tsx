interface QuantityInputProps {
  id?: string
  value: number
  onChange: (value: number) => void
  min?: number
}

export function QuantityInput({ id, value, onChange, min = 1 }: QuantityInputProps) {
  return (
    <div className="d-flex align-items-stretch gap-2">
      <button
        type="button"
        className="btn fw-bold flex-shrink-0"
        style={{ width: 48, background: 'var(--bl-surface-2)', border: '1px solid var(--bl-border)' }}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Diminuir"
      >
        −
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        className="form-control text-center fw-semibold"
        value={value}
        min={min}
        onChange={(e) => {
          const parsed = Number.parseInt(e.target.value, 10)
          onChange(Number.isNaN(parsed) ? min : Math.max(min, parsed))
        }}
      />
      <button
        type="button"
        className="btn fw-bold flex-shrink-0"
        style={{ width: 48, background: 'var(--bl-surface-2)', border: '1px solid var(--bl-border)' }}
        onClick={() => onChange(value + 1)}
        aria-label="Aumentar"
      >
        +
      </button>
    </div>
  )
}
