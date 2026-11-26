// noinspection JSUnusedGlobalSymbols

import { clsx } from 'clsx'
import { useId } from 'react'
import {
  href,
  matchPath,
  Outlet,
  type ShouldRevalidateFunction,
  useLocation,
} from 'react-router'
import { AdminAvatar } from '~/components/admin/admin-avatar'
import { AdministrationContent } from '~/components/admin/administration-content'
import { AdministrationTopBar } from '~/components/admin/administration-top-bar'
import { AdministrationTopBarTitle } from '~/components/admin/administration-top-bar-title'
import { SidebarHighlightProvider } from '~/components/admin/sidebar-highlight-provider'
import { AdministrationSidebarFoot } from '~/components/administration-sidebar-foot'
import { AdministrationSidebarItem } from '~/components/administration-sidebar-item'
import { AdministrationSidebarList } from '~/components/administration-sidebar-list'
import { AdministrationSidebarNav } from '~/components/administration-sidebar-nav'
import { AdministrationSidebarSeparator } from '~/components/administration-sidebar-separator'
import { AdministrationSidebarUser } from '~/components/administration-sidebar-user'
import { AdministrationSidebarUserName } from '~/components/administration-sidebar-user-name'
import { AdministrationSidebarUserRole } from '~/components/administration-sidebar-user-role'
import { AdministrationSidebarUserText } from '~/components/administration-sidebar-user-text'
import { AuthenticityTokenProvider } from '~/components/authenticity-token-provider'
import { ColumnAdministrationSidebar } from '~/components/column-administration-sidebar'
import { FullScreenAdministrationSidebar } from '~/components/full-screen-administration-sidebar'
import { PageTransition } from '~/components/page-transition'
import { RootBoundaryError } from '~/components/root-boundary-error'
import { ToastProvider } from '~/components/toast-provider'
import { useAccountEvents } from '~/hooks/use-account-events'
import { useFullScreenMenu } from '~/hooks/use-full-screen-menu'
import { hasOwnMobileBar } from '~/utils/has-own-mobile-bar'
import { skipsOwnAccountReload } from '~/utils/skips-own-account-reload'
import { isOwnAccountEvent } from '~/utils/sse/is-own-account-event'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { loader } from './_loader'

// From this width the sidebar stands in its column; below it, behind Menu
// (design 22g, tbi5qpq9), the same breakpoint as the website menu (10b).
const SIDEBAR_COLUMN_QUERY = '(width >= 768px)'

type NavigationItem = {
  to: string
  label: string
  end?: boolean
}

// A 403 action may be a refused form token (design 30h): reload the layout so its
// loader reissues the token and the form's second press goes through.
export const shouldRevalidate: ShouldRevalidateFunction = ({
  actionStatus,
  defaultShouldRevalidate,
}) => actionStatus === 403 || defaultShouldRevalidate

export default function RouteComponent({
  loaderData,
  matches,
}: Route.ComponentProps) {
  const { account, permissions, user } = loaderData

  // A role, a name or a photo changed elsewhere for this account: the sidebar,
  // the permissions and the page follow, except in an editor (log 0042).
  useAccountEvents({
    filter: (event) =>
      account !== null &&
      isOwnAccountEvent(event, account) &&
      !skipsOwnAccountReload(matches),
  })

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

  const renderItem = (item: NavigationItem) => (
    <AdministrationSidebarItem end={item.end} key={item.to} to={item.to}>
      {item.label}
    </AdministrationSidebarItem>
  )

  // The same content in the column and in the menu (design 22a, tbi5qpq9).
  const sidebarContent = (
    <>
      <AdministrationSidebarNav>
        <AdministrationSidebarList>
          {contentItems.map(renderItem)}
        </AdministrationSidebarList>
        {peopleItems.length > 0 && (
          <>
            <AdministrationSidebarSeparator />
            <AdministrationSidebarList>
              {peopleItems.map(renderItem)}
            </AdministrationSidebarList>
          </>
        )}
      </AdministrationSidebarNav>
      <AdministrationSidebarFoot>
        <AdministrationSidebarUser>
          <AdminAvatar
            alt={user.name}
            image={user.image}
            name={user.name}
            size={'extra-small'}
          />
          <AdministrationSidebarUserText>
            <AdministrationSidebarUserName>
              {user.name}
            </AdministrationSidebarUserName>
            {user.roleLabel && (
              <AdministrationSidebarUserRole>
                {user.roleLabel}
              </AdministrationSidebarUserRole>
            )}
          </AdministrationSidebarUserText>
        </AdministrationSidebarUser>
      </AdministrationSidebarFoot>
    </>
  )

  return (
    <AuthenticityTokenProvider token={loaderData.csrfToken}>
      <SidebarHighlightProvider>
        <ToastProvider>
          <div className={styles.layout}>
            <AdministrationTopBar
              className={clsx(
                styles.topBar,
                // The page's own bar stands in its place (24f).
                hasOwnMobileBar(matches) && styles.topBarHidden,
              )}
              controls={menuId}
              expanded={isMenuOpen}
              onMenu={open}
            >
              {activeItem !== undefined && (
                <AdministrationTopBarTitle>
                  {activeItem.label}
                </AdministrationTopBarTitle>
              )}
            </AdministrationTopBar>
            <ColumnAdministrationSidebar className={styles.sidebar}>
              {sidebarContent}
            </ColumnAdministrationSidebar>
            <dialog
              aria-label={'Menu'}
              className={styles.menu}
              id={menuId}
              ref={menuRef}
            >
              <FullScreenAdministrationSidebar
                closeButtonRef={closeButtonRef}
                onClose={close}
              >
                {sidebarContent}
              </FullScreenAdministrationSidebar>
            </dialog>
            <AdministrationContent className={styles.page}>
              {/* Keyed by the path alone: a list's filters write the search,
                  and a new page would take the focus out of the field. */}
              <PageTransition transitionKey={pathname}>
                <Outlet />
              </PageTransition>
            </AdministrationContent>
          </div>
        </ToastProvider>
      </SidebarHighlightProvider>
    </AuthenticityTokenProvider>
  )
}

// The layout's own loader failed, so nothing it provides can render (design 30g, root).
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RootBoundaryError error={error} />
}
