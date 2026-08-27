import logo from '../assets/logo-mark.png'

export function LoadingScreen() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center gap-3" style={{ minHeight: '100dvh' }}>
      <img src={logo} alt="Belook" width={56} height={56} className="rounded-4" />
      <div className="spinner-border" style={{ width: '1.75rem', height: '1.75rem', color: 'var(--bl-primary)' }} role="status">
        <span className="visually-hidden">Carregando…</span>
      </div>
    </div>
  )
}
