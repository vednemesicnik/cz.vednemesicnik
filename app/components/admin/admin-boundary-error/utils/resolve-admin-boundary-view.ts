import {
  type AdminContentKindMatch,
  type ContentKind,
  getAdminContentKind,
} from '~/components/boundary-error/utils/content-kind'
import {
  type AdminBoundaryView,
  resolveAdminBoundary,
} from '~/components/boundary-error/utils/resolve-boundary'
import { createPageTitle } from '~/utils/create-page-title'

type BoundaryLocation = {
  pathname: string
  search: string
}

const getMatch = (
  pathname: string,
  kind: ContentKind | null | undefined,
): AdminContentKindMatch | null => {
  const match = getAdminContentKind(pathname)

  if (kind === undefined) return match
  if (kind === null) return null
  return { kind, podcastId: match?.podcastId }
}

/**
 * Resolves what the administration boundary renders for the current address.
 *
 * @param error - The error handed to the boundary.
 * @param location - The current location.
 * @param kind - Overrides the record kind derived from the address; `null` renders a
 *   404 as an address that doesn't exist.
 * @returns The boundary view.
 */
export const resolveAdminBoundaryView = (
  error: unknown,
  { pathname, search }: BoundaryLocation,
  kind?: ContentKind | null,
): AdminBoundaryView =>
  resolveAdminBoundary(error, getMatch(pathname, kind), pathname + search)

/**
 * The document title of an administration boundary page (copy p28y7acs):
 * `{title} | Administrace | Vedneměsíčník`.
 *
 * @param error - The error handed to the boundary.
 * @param location - The current location.
 * @param kind - As in {@link resolveAdminBoundaryView}.
 * @returns The page title.
 */
export const getAdminBoundaryPageTitle = (
  error: unknown,
  location: BoundaryLocation,
  kind?: ContentKind | null,
): string => {
  const view = resolveAdminBoundaryView(error, location, kind)

  return createPageTitle(`${view.pageTitle ?? view.title} | Administrace`)
}
