import { getColorHex } from '../utils/colorSwatch'

interface ColorDotProps {
  color: string
  size?: number
}

/** Bolinha visual com a cor aproximada da variante, para identificar cores rapidamente nas listas. */
export function ColorDot({ color, size = 14 }: ColorDotProps) {
  const hex = getColorHex(color)
  return (
    <span
      title={color}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        background: hex ?? 'var(--bl-border)',
        border: hex === '#ffffff' ? '1px solid var(--bl-border)' : '1px solid rgba(0,0,0,0.08)',
      }}
    />
  )
}
