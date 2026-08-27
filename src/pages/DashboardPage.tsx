import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { EmptyState } from '../components/EmptyState'
import { Link } from 'react-router-dom'
import { getBusiness } from '../services/businessService'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardPage() {
  const { user, businessId } = useAuth()
  const firstName = (user?.displayName || user?.email?.split('@')[0] || '').split(' ')[0]

  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    if (!businessId) return
    getBusiness(businessId).then((business) => setCompanyName(business?.name ?? ''))
  }, [businessId])

  return (
    <div className="bl-page">
      <header className="pt-2 mb-4">
        <p className="text-muted-bl mb-0">
          {greeting()} 👋 <span className="text-capitalize">{firstName}</span>
        </p>
        <h1 className="h4 fw-bold mb-0">{companyName || 'Seu negócio'}</h1>
      </header>

      <div className="bl-card p-4">
        <EmptyState
          icon="bi-rocket-takeoff"
          title="Vamos configurar seu estoque"
          description="Cadastre seu primeiro produto para começar a acompanhar estoque, custos e vendas."
          action={
            <Link to="/products" className="btn btn-primary fw-semibold px-4">
              Cadastrar produto
            </Link>
          }
        />
      </div>
    </div>
  )
}
