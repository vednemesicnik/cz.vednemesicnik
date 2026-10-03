import { getAdminBoundaryPageTitle } from '~/components/admin/admin-boundary-error'

import type { Route } from './+types/route'

/**
 * Titles the section boundary page. Every administration page has its own `meta`, so
 * this one only takes effect when the layout renders its `ErrorBoundary`.
 *
 * @returns The page title for an error, otherwise nothing.
 */
export const meta: Route.MetaFunction = ({ error, location }) =>
  error === undefined
    ? []
    : [{ title: getAdminBoundaryPageTitle(error, location) }]
