// noinspection JSUnusedGlobalSymbols

import { AdminBoundaryError } from '~/components/admin/admin-boundary-error'

import type { Route } from './+types/route'

export { loader } from './_loader'
export { meta } from './_meta'

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  // The catch-all is always an address that doesn't exist, even under a record
  // (`/administration/articles/a1/nope`), so it never takes the record copy.
  return <AdminBoundaryError error={error} kind={null} />
}
