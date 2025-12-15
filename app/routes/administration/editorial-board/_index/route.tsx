import { AdminHeadline } from "~/components/admin-headline"
import { AdminNavigationCard } from "~/components/admin-navigation-card"
import { AdminNavigationGrid } from "~/components/admin-navigation-grid"
import { AdminPage } from "~/components/admin-page"

export default function RouteComponent() {
  return (
    <AdminPage>
      <AdminHeadline>Redakce</AdminHeadline>

      <AdminNavigationGrid>
        <AdminNavigationCard
          to="/administration/editorial-board/members"
          title="Členové"
          description="Správa členů redakce"
          icon="👥"
        />
        <AdminNavigationCard
          to="/administration/editorial-board/positions"
          title="Pozice"
          description="Správa pozic v redakci"
          icon="💼"
        />
      </AdminNavigationGrid>
    </AdminPage>
  )
}

export { meta } from "./_meta"
export { loader } from "./_loader"
