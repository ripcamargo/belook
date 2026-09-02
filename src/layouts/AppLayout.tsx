import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNavigation } from '../components/BottomNavigation'
import { useAuth } from '../hooks/useAuth'
import { getBusiness } from '../services/businessService'
import { applyThemeWithListener } from '../utils/theme'

export function AppLayout() {
  const { businessId } = useAuth()

  useEffect(() => {
    if (!businessId) return
    let cleanup: (() => void) | undefined
    getBusiness(businessId).then((business) => {
      cleanup = applyThemeWithListener(business?.theme ?? 'system')
    })
    return () => cleanup?.()
  }, [businessId])

  return (
    <div className="d-flex flex-column flex-fill">
      <main className="flex-fill">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}
