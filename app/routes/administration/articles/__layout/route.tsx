// noinspection JSUnusedGlobalSymbols

import { href, Outlet } from 'react-router'

import { AdminTab } from '~/components/admin-tab'
import { AdminTabs } from '~/components/admin-tabs'

export { handle } from './_handle'

export default function ArticlesLayoutRoute() {
  return (
    <>
      <AdminTabs>
        <AdminTab end to={href('/administration/articles')}>
          Články
        </AdminTab>
        <AdminTab to={href('/administration/articles/categories')}>
          Rubriky
        </AdminTab>
        <AdminTab to={href('/administration/articles/tags')}>Štítky</AdminTab>
      </AdminTabs>
      <Outlet />
    </>
  )
}
