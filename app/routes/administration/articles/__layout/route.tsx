// noinspection JSUnusedGlobalSymbols

import { href, Outlet, useMatch } from 'react-router'

import { AdminTab } from '~/components/admin/admin-tab'
import { AdminTabs } from '~/components/admin/admin-tabs'

export { handle } from './_handle'

export default function ArticlesLayoutRoute() {
  // Only on the three lists; a detail has its breadcrumbs instead (22a, 25a, 23a).
  const isArticleList = useMatch({
    end: true,
    path: '/administration/articles',
  })
  const isCategoryList = useMatch({
    end: true,
    path: '/administration/articles/categories',
  })
  const isTagList = useMatch({
    end: true,
    path: '/administration/articles/tags',
  })
  const isList =
    isArticleList !== null || isCategoryList !== null || isTagList !== null

  return (
    <>
      {isList && (
        <AdminTabs>
          <AdminTab end to={href('/administration/articles')}>
            Články
          </AdminTab>
          <AdminTab to={href('/administration/articles/categories')}>
            Rubriky
          </AdminTab>
          <AdminTab to={href('/administration/articles/tags')}>Štítky</AdminTab>
        </AdminTabs>
      )}
      <Outlet />
    </>
  )
}
