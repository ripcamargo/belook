import type { Business } from '../types'

export type Theme = Business['theme']

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Aplica o tema no <html>, resolvendo 'system' pela preferência atual do dispositivo. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme
}

/**
 * Aplica o tema e, quando 'system', mantém sincronizado com mudanças na
 * preferência do SO enquanto o app estiver aberto. Retorna uma função de
 * limpeza (ou undefined se não houver listener para remover).
 */
export function applyThemeWithListener(theme: Theme): (() => void) | undefined {
  applyTheme(theme)
  if (theme !== 'system') return undefined

  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const listener = () => applyTheme('system')
  mql.addEventListener('change', listener)
  return () => mql.removeEventListener('change', listener)
}
