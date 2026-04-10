// noinspection JSUnusedGlobalSymbols

import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminNavigationCard } from '~/components/admin/admin-navigation-card'
import { AdminNavigationGrid } from '~/components/admin/admin-navigation-grid'
import { AdminPage } from '~/components/admin/admin-page'

export { meta } from './_meta'

export default function RouteComponent() {
  return (
    <AdminPage>
      <AdminHeadline>Nastavení</AdminHeadline>

      <AdminNavigationGrid>
        <AdminNavigationCard
          description="Správa uživatelského profilu"
          icon="👤"
          title="Profil"
          to="/administration/settings/profile"
        />
      </AdminNavigationGrid>
    </AdminPage>
  )
}
