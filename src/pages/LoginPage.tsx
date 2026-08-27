import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo-mark.png'

export function LoginPage() {
  const { user, login, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleLogin() {
    setError(null)
    setGoogleSubmitting(true)
    try {
      await loginWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar com o Google.')
    } finally {
      setGoogleSubmitting(false)
    }
  }

  return (
    <div className="d-flex flex-column justify-content-center flex-fill px-4" style={{ minHeight: '100dvh' }}>
      <div className="mx-auto w-100" style={{ maxWidth: 360 }}>
        <div className="d-flex flex-column align-items-center text-center mb-4">
          <img src={logo} alt="Belook" width={64} height={64} className="rounded-4 mb-3" style={{ boxShadow: 'var(--bl-shadow)' }} />
          <h1 className="h4 fw-bold mb-1">Belook</h1>
          <p className="small text-muted-bl mb-0">Estoque, custos e vendas em um só lugar.</p>
        </div>

        <div className="bl-card p-4 d-flex flex-column gap-3">
          {error && (
            <div className="small px-3 py-2 rounded-3" style={{ background: 'var(--bl-danger-light)', color: 'var(--bl-danger)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <div>
            <label htmlFor="email" className="form-label small fw-semibold">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              className="form-control"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label small fw-semibold">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg fw-semibold mt-2" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
          </form>

          <div className="d-flex align-items-center gap-2 text-muted-bl small">
            <hr className="flex-fill my-0" style={{ borderColor: 'var(--bl-border)' }} />
            ou
            <hr className="flex-fill my-0" style={{ borderColor: 'var(--bl-border)' }} />
          </div>

          <button
            type="button"
            className="btn btn-lg fw-semibold d-flex align-items-center justify-content-center gap-2"
            style={{ background: 'var(--bl-surface)', border: '1px solid var(--bl-border)', color: 'var(--bl-text)' }}
            disabled={googleSubmitting}
            onClick={handleGoogleLogin}
          >
            <GoogleIcon />
            {googleSubmitting ? 'Entrando…' : 'Entrar com Google'}
          </button>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.97H.95a9 9 0 0 0 0 8.06l3-2.33Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  )
}
