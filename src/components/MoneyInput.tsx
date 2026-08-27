import { useEffect, useState } from 'react'
import { parseMoneyToCents } from '../utils/money'

interface MoneyInputProps {
  id?: string
  value: number
  onChange: (cents: number) => void
  placeholder?: string
}

function centsToText(cents: number): string {
  if (!cents) return ''
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function MoneyInput({ id, value, onChange, placeholder = '0,00' }: MoneyInputProps) {
  const [text, setText] = useState(centsToText(value))

  useEffect(() => {
    setText(centsToText(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="input-group">
      <span className="input-group-text bg-transparent" style={{ borderColor: 'var(--bl-border)' }}>
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        className="form-control"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const cents = parseMoneyToCents(text)
          onChange(cents)
          setText(centsToText(cents))
        }}
      />
    </div>
  )
}
