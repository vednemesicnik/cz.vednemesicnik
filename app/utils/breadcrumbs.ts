import type { UIMatch } from 'react-router'

import type { Breadcrumb, BreadcrumbCapableMatch } from '~/types/breadcrumb'

/**
 * Type predicate to check if a match has breadcrumb capability.
 *
 * @param match - A React Router UIMatch object to check
 * @returns Type predicate indicating if the match has breadcrumb functionality
 *
 * @example
 * ```typescript
 * const matches = useMatches()
 * const breadcrumbMatches = matches.filter(hasBreadcrumb)
 * ```
 */
function hasBreadcrumb(
  match: UIMatch | unknown,
): match is BreadcrumbCapableMatch {
  return (
    match !== null &&
    typeof match === 'object' &&
    'handle' in match &&
    match.handle !== null &&
    typeof match.handle === 'object' &&
    'breadcrumb' in match.handle &&
    typeof match.handle.breadcrumb === 'function'
  )
}

/**
 * Extracts breadcrumb data from React Router matches.
 *
 * Filters the provided matches for those that have breadcrumb capability using the
 * `hasBreadcrumb` type predicate, then maps them to breadcrumb objects by calling
 * each match's breadcrumb function.
 *
 * @param matches - Array of React Router UIMatch objects
 * @returns Array of breadcrumb objects with `label` and `path` properties
 *
 * @example
 * ```typescript
 * // In a meta function
 * export const meta: Route.MetaFunction = ({ matches, loaderData }) => {
 *   const breadcrumbs = getBreadcrumbs(matches as UIMatch[])
 *   // Use breadcrumbs for structured data...
 * }
 *
 * // In a component
 * const matches = useMatches()
 * const breadcrumbs = getBreadcrumbs(matches)
 * ```
 */
export function getBreadcrumbs(matches: unknown[]): Breadcrumb[] {
  return matches
    .filter(hasBreadcrumb)
    .map((match) => match.handle.breadcrumb(match))
}

/**
 * Generates Schema.org BreadcrumbList structured data for SEO.
 *
 * Creates JSON-LD structured data that helps search engines understand your site's
 * navigation hierarchy, potentially improving search result displays with rich
 * breadcrumb trails.
 *
 * @param breadcrumbs - Array of breadcrumb objects with label and path
 * @param baseUrl - Base URL for generating absolute paths in structured data
 * @returns JSON-LD object conforming to Schema.org BreadcrumbList specification
 *
 * @example
 * ```typescript
 * export const meta: Route.MetaFunction = ({ matches, loaderData }) => {
 *   const breadcrumbs = getBreadcrumbs(matches as UIMatch[])
 *   const breadcrumbStructuredData = createBreadcrumbStructuredData(
 *     breadcrumbs,
 *     loaderData.baseUrl
 *   )
 *   return [{ 'script:ld+json': breadcrumbStructuredData }]
 * }
 * ```
 *
 * @see https://schema.org/BreadcrumbList
 */
export const createBreadcrumbStructuredData = (
  breadcrumbs: Breadcrumb[],
  baseUrl: string,
) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => {
      const url = new URL(breadcrumb.path, baseUrl)

      return {
        '@type': 'ListItem',
        item: url.href,
        name: breadcrumb.label,
        position: index + 1,
      }
    }),
  }
}
