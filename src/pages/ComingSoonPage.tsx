import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'

interface ComingSoonPageProps {
  title: string
  icon: string
  description?: string
}

/** Placeholder honesto para telas que ainda serão construídas nas próximas etapas. */
export function ComingSoonPage({ title, icon, description }: ComingSoonPageProps) {
  return (
    <div className="bl-page">
      <PageHeader title={title} />
      <EmptyState
        icon={icon}
        title="Em construção"
        description={description ?? 'Esta área ainda será implementada nas próximas etapas.'}
      />
    </div>
  )
}
