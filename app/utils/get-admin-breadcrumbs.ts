import type { Breadcrumb } from '~/types/breadcrumb'

import { getBreadcrumbs } from './breadcrumbs'

const startsTrail = (match: unknown) =>
  typeof match === 'object' &&
  match !== null &&
  'handle' in match &&
  typeof match.handle === 'object' &&
  match.handle !== null &&
  'breadcrumb' in match.handle &&
  'breadcrumbStartsTrail' in match.handle &&
  match.handle.breadcrumbStartsTrail === true

/**
 * The administration's breadcrumb trail (design 22a, 23a): it starts at the
 * section, or at a sub-section that starts its own trail, and stands only on
 * a record. A trail of one is a list, which the panel and the tabs already
 * name: „Na seznamu drobečky nejsou“ (22a).
 *
 * @param matches - The route matches.
 * @returns The crumbs to show, or none.
 */
export const getAdminBreadcrumbs = (matches: unknown[]): Breadcrumb[] => {
  const lastStart = matches.reduce<number>(
    (last, match, index) => (startsTrail(match) ? index : last),
    -1,
  )
  const trail = getBreadcrumbs(
    lastStart === -1 ? matches : matches.slice(lastStart),
  )

  return trail.length < 2 ? [] : trail
}
