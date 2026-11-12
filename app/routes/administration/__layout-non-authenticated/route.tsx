// noinspection JSUnusedGlobalSymbols

import { href, Outlet, useLocation } from 'react-router'
import { AdministrationContent } from '~/components/admin/administration-content'
import { BaseLink } from '~/components/base-link'
import { HoneypotProvider } from '~/components/honeypot-provider'
import { PageTransition } from '~/components/page-transition'
import { RootBoundaryError } from '~/components/root-boundary-error'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { loader } from './_loader'

// The sign-in screens stand on a grey page without header or footer (design 20a);
// under every card a way to the website, in the same tab (s21ljh49).
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { pathname } = useLocation()

  return (
    <HoneypotProvider {...loaderData.honeypotInputProps}>
      <div className={styles.layout}>
        <AdministrationContent className={styles.page}>
          <PageTransition transitionKey={pathname}>
            <Outlet />
          </PageTransition>
          <BaseLink className={styles.siteLink} to={href('/')}>
            Přejít na web
          </BaseLink>
        </AdministrationContent>
      </div>
    </HoneypotProvider>
  )
}

// The layout's own loader failed, so nothing it provides can render (design 30g, root).
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RootBoundaryError error={error} />
}
