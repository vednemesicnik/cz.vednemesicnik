// noinspection JSUnusedGlobalSymbols

import { useId } from 'react'
import {
  href,
  matchPath,
  Outlet,
  type ShouldRevalidateFunction,
  useLocation,
} from 'react-router'
import { AdministrationContent } from '~/components/admin/administration-content'
import { AdministrationPageFooter } from '~/components/admin/administration-page-footer'
import {
  AdministrationSidebar,
  type NavigationItem,
} from '~/components/admin/administration-sidebar'
import { AdministrationTopBar } from '~/components/admin/administration-top-bar'
import { SidebarHighlightProvider } from '~/components/admin/sidebar-highlight-provider'
import { AuthenticityTokenProvider } from '~/components/authenticity-token-provider'
import { RootBoundaryError } from '~/components/root-boundary-error'
import { useFullScreenMenu } from '~/hooks/use-full-screen-menu'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { loader } from './_loader'

// From this width the sidebar stands in its column; below it, behind Menu
// (design 22g, tbi5qpq9), the same breakpoint as the website menu (10b).
const SIDEBAR_COLUMN_QUERY = '(width >= 768px)'

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

  const { pathname } = useLocation()
  const menuId = useId()
  const { close, closeButtonRef, isMenuOpen, menuRef, open } =
    useFullScreenMenu(SIDEBAR_COLUMN_QUERY)

  // The top bar names the page by its active sidebar item (tbi5qpq9).
  const activeItem = [
    ...contentItems,
    ...peopleItems,
    { label: 'Nastavení', to: href('/administration/settings') },
  ].find((item) =>
    matchPath({ end: item.end ?? false, path: item.to }, pathname),
  )

  return (
    <AuthenticityTokenProvider token={loaderData.csrfToken}>
      <SidebarHighlightProvider>
        <div className={styles.layout}>
          <AdministrationTopBar
            className={styles.topBar}
            controls={menuId}
            expanded={isMenuOpen}
            onMenu={open}
            title={activeItem?.label}
          />
          <AdministrationSidebar
            className={styles.sidebar}
            contentItems={contentItems}
            peopleItems={peopleItems}
            user={user}
          />
          <dialog
            aria-label={'Menu'}
            className={styles.menu}
            id={menuId}
            ref={menuRef}
          >
            <AdministrationSidebar
              closeButtonRef={closeButtonRef}
              contentItems={contentItems}
              layout={'menu'}
              onClose={close}
              peopleItems={peopleItems}
              user={user}
            />
          </dialog>
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
