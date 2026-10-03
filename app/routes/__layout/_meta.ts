import {
  getWebsiteContentKind,
  resolveWebsiteBoundary,
} from '~/components/boundary-error'
import { createPageTitle } from '~/utils/create-page-title'

import type { Route } from './+types/route'

/**
 * Titles the website boundary page. Every website page has its own `meta`, so this one
 * only takes effect when the layout renders its `ErrorBoundary`.
 *
 * @returns The page title for an error, otherwise nothing.
 */
export const meta: Route.MetaFunction = ({ error, location }) => {
  // `Meta` passes `null`, not `undefined`, when nothing failed.
  if (error === null || error === undefined) return []

  const { pathname, search } = location
  const view = resolveWebsiteBoundary(
    error,
    getWebsiteContentKind(pathname),
    pathname + search,
  )

  return [{ title: createPageTitle(view.pageTitle) }]
}
