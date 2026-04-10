import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminNavigationCard } from '~/components/admin/admin-navigation-card'
import { AdminNavigationGrid } from '~/components/admin/admin-navigation-grid'
import { AdminPage } from '~/components/admin/admin-page'

export default function RouteComponent() {
  return (
    <AdminPage>
      <AdminHeadline>Redakce</AdminHeadline>

      <AdminNavigationGrid>
        <AdminNavigationCard
          description="Správa členů redakce"
          icon="👥"
          title="Členové"
          to="/administration/editorial-board/members"
        />
        <AdminNavigationCard
          description="Správa pozic v redakci"
          icon="💼"
          title="Pozice"
          to="/administration/editorial-board/positions"
        />
      </AdminNavigationGrid>
    </AdminPage>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
