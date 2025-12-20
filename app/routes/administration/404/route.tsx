// noinspection JSUnusedGlobalSymbols

import { isRouteErrorResponse } from 'react-router'

import { AdminHeadline } from '~/components/admin-headline'
import { AdminPage } from '~/components/admin-page'
import { AdminParagraph } from '~/components/admin-paragraph'

import type { Route } from './+types/route'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <AdminPage>
        <AdminHeadline>
          {error.status} – {error.statusText}
        </AdminHeadline>
        <AdminParagraph>{error.data}</AdminParagraph>
      </AdminPage>
    )
  } else {
    return (
      <AdminPage>
        <AdminHeadline>Jejda, něco se pokazilo</AdminHeadline>
        <AdminParagraph>
          Narazili jsme na neočekávanou chybu. Zkuste to prosím znovu, nebo se
          obraťte na technickou podporu, pokud problém přetrvává.
        </AdminParagraph>
      </AdminPage>
    )
  }
}
