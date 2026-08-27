import { Outlet } from 'react-router-dom'
import { BottomNavigation } from '../components/BottomNavigation'

export function AppLayout() {
  return (
    <div className="d-flex flex-column flex-fill">
      <main className="flex-fill">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}
