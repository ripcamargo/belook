import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { QuickActionSheet } from './QuickActionSheet'

const NAV_ITEMS = [
  { to: '/', icon: 'bi-house', label: 'Início', end: true },
  { to: '/inventory', icon: 'bi-box-seam', label: 'Estoque', end: false },
  { to: '/orders', icon: 'bi-bag', label: 'Pedidos', end: false },
  { to: '/finance', icon: 'bi-wallet2', label: 'Financeiro', end: false },
  { to: '/more', icon: 'bi-grid-3x3-gap', label: 'Mais', end: false },
]

export function BottomNavigation() {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <QuickActionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      <nav
        className="position-fixed bottom-0 start-0 w-100 d-flex"
        style={{
          height: 'calc(var(--bl-nav-height) + var(--bl-safe-bottom))',
          paddingBottom: 'var(--bl-safe-bottom)',
          background: 'var(--bl-surface)',
          borderTop: '1px solid var(--bl-border)',
          zIndex: 1040,
        }}
      >
        {/* position-relative aqui (não na janela inteira) para que o FAB fique ancorado
            no canto do mesmo container de largura máxima da barra — em telas largas de
            desktop ele acompanha a barra centralizada em vez de grudar na borda da janela. */}
        <div className="d-flex w-100 mx-auto position-relative" style={{ maxWidth: 720 }}>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}

          {/* FAB flutuante acima da barra, no canto direito — evita o problema de tentar
              centralizar o botão entre um número desigual de abas de cada lado. */}
          <button
            type="button"
            aria-label="Ação rápida"
            onClick={() => setSheetOpen(true)}
            className="btn btn-primary d-flex align-items-center justify-content-center position-absolute p-0 border-0"
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              right: 12,
              top: -70,
              fontSize: '1.6rem',
              boxShadow: 'var(--bl-shadow-lg)',
            }}
          >
            <i className="bi bi-plus" />
          </button>
        </div>
      </nav>
    </>
  )
}

function NavItem({ to, icon, label, end }: { to: string; icon: string; label: string; end: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `d-flex flex-column align-items-center justify-content-center gap-1 text-decoration-none ${
          isActive ? '' : 'text-muted-bl'
        }`
      }
      style={({ isActive }) => ({
        flex: '1 1 0%',
        color: isActive ? 'var(--bl-primary)' : undefined,
        fontSize: '0.7rem',
        fontWeight: isActive ? 600 : 500,
      })}
    >
      <i className={`bi ${icon}`} style={{ fontSize: '1.2rem' }} />
      {label}
    </NavLink>
  )
}
