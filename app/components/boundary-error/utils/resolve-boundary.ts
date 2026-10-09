import { isRouteErrorResponse } from 'react-router'

import {
  adminGenericForbiddenCopy,
  adminUnknownAddressCopy,
  type BoundaryCopy,
  getAdminCsrfCopy,
  getAdminRecordNotFoundCopy,
  getPageLoadFailedCopy,
  getWebsiteNotFoundCopy,
  getWebsiteUnexpectedCopy,
} from './boundary-copy'
import { parseForbiddenData, parseNotFoundEpisodeData } from './boundary-data'
import type { AdminContentKindMatch, ContentKind } from './content-kind'
import { parseNotFoundPageData } from './parse-not-found-page-data'

export type BoundaryView = BoundaryCopy & {
  unexpected: boolean
}

export type AdminBoundaryView = BoundaryView & {
  highlightsSection: boolean
}

/**
 * Resolves what the website boundary renders (design 30f, 30g). Only a 404 gets its
 * own page; everything else, a 403 included, is unexpected.
 *
 * @param error - The error handed to the boundary.
 * @param kind - What the visitor was looking for, or `null`.
 * @param currentHref - The current address, reloaded by `Zkusit znovu`.
 * @returns The copy to render and whether the error was unexpected
 *   (development diagnostics show only then).
 */
export const resolveWebsiteBoundary = (
  error: unknown,
  kind: ContentKind | null,
  currentHref: string,
): BoundaryView => {
  if (isRouteErrorResponse(error) && error.status === 404) {
    const episodeData = parseNotFoundEpisodeData(error.data)
    const isPagePastLast = parseNotFoundPageData(error.data) !== null
    return {
      ...getWebsiteNotFoundCopy(
        isPagePastLast ? null : kind,
        episodeData?.podcastHref,
      ),
      unexpected: false,
    }
  }

  return { ...getWebsiteUnexpectedCopy(currentHref), unexpected: true }
}

/**
 * Resolves what the administration boundary renders (design 30d, 30e, 30g, 30h).
 *
 * @param error - The error handed to the boundary.
 * @param match - The record the address points at, or `null` for an address that
 *   doesn't exist.
 * @param currentHref - The current address, reloaded by `Zkusit znovu` and by
 *   `Načíst znovu` when the thrown data doesn't name the page.
 * @returns The copy to render, whether the error was unexpected, and whether the
 *   sidebar should keep the section of the address highlighted.
 */
export const resolveAdminBoundary = (
  error: unknown,
  match: AdminContentKindMatch | null,
  currentHref: string,
): AdminBoundaryView => {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return match === null
      ? {
          ...adminUnknownAddressCopy,
          highlightsSection: false,
          unexpected: false,
        }
      : {
          ...getAdminRecordNotFoundCopy(match.kind, match.podcastId),
          highlightsSection: true,
          unexpected: false,
        }
  }

  if (isRouteErrorResponse(error) && error.status === 403) {
    const forbiddenData = parseForbiddenData(error.data)

    if (forbiddenData?.cause === 'permission') {
      return {
        actions: forbiddenData.actions,
        highlightsSection: true,
        pageTitle: forbiddenData.pageTitle,
        sentence: forbiddenData.reason,
        title: forbiddenData.title,
        unexpected: false,
      }
    }

    if (forbiddenData?.cause === 'csrf') {
      return {
        ...getAdminCsrfCopy(forbiddenData.href ?? currentHref),
        highlightsSection: true,
        unexpected: false,
      }
    }

    return {
      ...adminGenericForbiddenCopy,
      highlightsSection: false,
      unexpected: false,
    }
  }

  return {
    ...getPageLoadFailedCopy(currentHref),
    highlightsSection: true,
    unexpected: true,
  }
}
