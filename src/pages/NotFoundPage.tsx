import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'

export function NotFoundPage() {
  return (
    <div className="bl-page">
      <EmptyState
        icon="bi-signpost-2"
        title="Página não encontrada"
        description="O endereço acessado não existe."
        action={
          <Link to="/" className="btn btn-primary fw-semibold px-4">
            Voltar ao início
          </Link>
        }
      />
    </div>
  )
}
