// noinspection JSUnusedGlobalSymbols

import { Outlet, type ShouldRevalidateFunction } from 'react-router'
import { AdministrationContent } from '~/components/admin/administration-content'
import { AdministrationPageFooter } from '~/components/admin/administration-page-footer'
import {
  AdministrationSidebar,
  type NavigationItem,
} from '~/components/admin/administration-sidebar'
import { SidebarHighlightProvider } from '~/components/admin/sidebar-highlight-provider'
import { AuthenticityTokenProvider } from '~/components/authenticity-token-provider'
import { RootBoundaryError } from '~/components/root-boundary-error'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { loader } from './_loader'

// A 403 action may be a refused form token (design 30h): reload the layout so its
// loader reissues the token and the form's second press goes through.
export const shouldRevalidate: ShouldRevalidateFunction = ({
  actionStatus,
  defaultShouldRevalidate,
}) => actionStatus === 403 || defaultShouldRevalidate

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { permissions, user } = loaderData

  // Order per design 22a: content on top, people below the rule.
  const contentItems: NavigationItem[] = [
    { end: true, label: 'Přehled', to: '/administration' },
    ...(permissions.canViewArticles
      ? [{ label: 'Články', to: '/administration/articles' }]
      : []),
    ...(permissions.canViewPodcasts
      ? [{ label: 'Podcasty', to: '/administration/podcasts' }]
      : []),
    ...(permissions.canViewIssues
      ? [{ label: 'Archiv', to: '/administration/archive' }]
      : []),
  ]

  // Nastavení is under the name in the sidebar foot, not an item (design 29a).
  const peopleItems: NavigationItem[] = [
    ...(permissions.canViewAuthors
      ? [{ label: 'Autoři', to: '/administration/authors' }]
      : []),
    ...(permissions.canViewUsers
      ? [{ label: 'Uživatelé', to: '/administration/users' }]
      : []),
  ]

  return (
    <AuthenticityTokenProvider token={loaderData.csrfToken}>
      <SidebarHighlightProvider>
        <div className={styles.layout}>
          <AdministrationSidebar
            contentItems={contentItems}
            peopleItems={peopleItems}
            user={user}
          />
          <AdministrationContent className={styles.page}>
            <Outlet />
          </AdministrationContent>
          <AdministrationPageFooter />
        </div>
      </SidebarHighlightProvider>
    </AuthenticityTokenProvider>
  )
}

// The layout's own loader failed, so nothing it provides can render (design 30g, root).
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RootBoundaryError error={error} />
}
