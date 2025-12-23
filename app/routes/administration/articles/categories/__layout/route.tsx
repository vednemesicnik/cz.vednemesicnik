// noinspection JSUnusedGlobalSymbols

import { isRouteErrorResponse, Outlet } from 'react-router'
import { AdminHeadline } from '~/components/admin-headline'
import { AdminPage } from '~/components/admin-page'
import { AdminParagraph } from '~/components/admin-paragraph'
import type { Route } from './+types/route'

export { handle } from './_handle'

export default function LayoutRouteComponent() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <AdminPage>
        <AdminHeadline>
          {error.status} {error.statusText}
        </AdminHeadline>
        <AdminParagraph>{error.data}</AdminParagraph>
      </AdminPage>
    )
  } else if (error instanceof Error) {
    return (
      <AdminPage>
        <AdminHeadline>Error</AdminHeadline>
        <AdminParagraph>{error.message}</AdminParagraph>
        <AdminParagraph>The stack trace is:</AdminParagraph>
        <pre>{error.stack}</pre>
      </AdminPage>
    )
  } else {
    return (
      <AdminPage>
        <AdminHeadline>Neznámá chyba</AdminHeadline>
      </AdminPage>
    )
  }
}
