// noinspection JSUnusedGlobalSymbols

import { Outlet } from 'react-router'

import { AdminHeader } from '~/components/admin-header'
import { AdminUserMenu } from '~/components/admin-user-menu'
import { AdministrationContent } from '~/components/administration-content'
import { AdministrationFooter } from '~/components/administration-footer'
import { AdministrationSidebar } from '~/components/administration-sidebar'
import { AuthenticityTokenProvider } from '~/components/authenticity-token-provider'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { loader } from './_loader'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const user = {
    email: loaderData?.user.email ?? '',
    name: loaderData?.user.name,
  }

  const { permissions } = loaderData

  const navigationItems = [
    { end: true, label: 'Přehled', to: '/administration', visible: true },
    {
      label: 'Uživatelé',
      to: '/administration/users',
      visible: permissions.canViewUsers,
    },
    {
      label: 'Autoři',
      to: '/administration/authors',
      visible: permissions.canViewAuthors,
    },
    {
      label: 'Články',
      to: '/administration/articles',
      visible: permissions.canViewArticles,
    },
    {
      label: 'Podcasty',
      to: '/administration/podcasts',
      visible: permissions.canViewPodcasts,
    },
    {
      label: 'Archiv',
      to: '/administration/archive',
      visible: permissions.canViewIssues,
    },
    {
      label: 'Redakce',
      to: '/administration/editorial-board',
      visible: permissions.canViewEditorialBoard,
    },
    { label: 'Nastavení', to: '/administration/settings', visible: true },
  ]

  return (
    <AuthenticityTokenProvider token={loaderData.csrfToken}>
      <div className={styles.layout}>
        <AdminHeader>
          <AdminUserMenu userEmail={user.email} userName={user.name} />
        </AdminHeader>
        <AdministrationSidebar navigationItems={navigationItems} />
        <AdministrationContent className={styles.page}>
          <Outlet />
        </AdministrationContent>
        <AdministrationFooter />
      </div>
    </AuthenticityTokenProvider>
  )
}
