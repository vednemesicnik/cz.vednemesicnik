import type { ContentState } from '@generated/prisma/enums'

import { type CountForms, EPISODE_NOUN } from '~/config/list-noun-config'
import { formatDraftCount } from '~/utils/format-draft-count'
import { formatListCount } from '~/utils/format-list-count'
import { formatNumericDate } from '~/utils/format-numeric-date'

import type { PodcastEpisodeSummary } from './summarize-podcast-episodes'

type Options = {
  summary: PodcastEpisodeSummary
  podcastState: ContentState
  isContributor: boolean
}

type DetailPart = {
  text: string
  isPending: boolean
}

type PodcastEpisodeLines = {
  count: string
  phoneCount: string
  detail: DetailPart[]
}

const adjectiveForms = (
  one: string,
  few: string,
  other: string,
): CountForms => ({
  few,
  many: other,
  one,
  other,
  two: other,
  zero: other,
})

// Approved and submitted episodes, by the column's noun (copy djni9qbc).
const APPROVED_FORMS = adjectiveForms('schválená', 'schválené', 'schválených')
const SUBMITTED_FORMS = adjectiveForms('odeslaná', 'odeslané', 'odeslaných')

/**
 * The two lines of a podcast's Epizody column (design 27a, copy djni9qbc).
 *
 * @param options.summary - The podcast's episodes, as counted for the viewer.
 * @param options.podcastState - Only a published podcast's episodes are on
 *   the web; another's count names the episodes (`6 epizod`).
 * @param options.isContributor - A Contributor approves nothing: their
 *   waiting and approved episodes are one `odeslaná`, as the Stav filter's
 *   Odeslané (22i).
 * @returns The count (`11 na webu`, `žádné na webu`, `6 epizod`), and as a
 *   phone has no column header, the count naming the episodes
 *   (`11 epizod na webu`, `žádné epizody na webu`; 32c, copy myx395rj); and
 *   the parts of the line under it, joined by ` · `: what is in progress
 *   (`1 ke schválení`, `1 schválená`, `1 koncept`), else the latest episode's
 *   date (`poslední 19. 9. 2026`), else none. Only the waiting part is
 *   marked, which the row shows in amber (27a, 32c; tbrpv6cr).
 */
export const formatPodcastEpisodeLines = ({
  summary,
  podcastState,
  isContributor,
}: Options): PodcastEpisodeLines => {
  const episodes = formatListCount(
    summary.publishedCount,
    EPISODE_NOUN.countForms,
  )
  const isOnWeb = podcastState === 'published'
  const count =
    summary.publishedCount === 0
      ? 'žádné na webu'
      : isOnWeb
        ? `${summary.publishedCount.toLocaleString('cs-CZ')} na webu`
        : episodes
  const phoneCount =
    summary.publishedCount === 0
      ? 'žádné epizody na webu'
      : isOnWeb
        ? `${episodes} na webu`
        : episodes

  const submittedCount = summary.pendingCount + summary.approvedCount
  // A Contributor's submitted episodes wait on nobody they can act for, so
  // they are not marked (copy djni9qbc).
  const progress: (DetailPart | null)[] = isContributor
    ? [
        submittedCount > 0
          ? {
              isPending: false,
              text: formatListCount(submittedCount, SUBMITTED_FORMS),
            }
          : null,
      ]
    : [
        summary.pendingCount > 0
          ? {
              isPending: true,
              text: `${summary.pendingCount.toLocaleString('cs-CZ')} ke schválení`,
            }
          : null,
        summary.approvedCount > 0
          ? {
              isPending: false,
              text: formatListCount(summary.approvedCount, APPROVED_FORMS),
            }
          : null,
      ]
  const detail = progress
    .concat(
      summary.draftCount > 0
        ? { isPending: false, text: formatDraftCount(summary.draftCount) }
        : null,
    )
    .filter((part) => part !== null)

  if (detail.length > 0) {
    return { count, detail, phoneCount }
  }

  return {
    count,
    detail:
      summary.latestPublishedAt === null
        ? []
        : [
            {
              isPending: false,
              text: `poslední ${formatNumericDate(summary.latestPublishedAt)}`,
            },
          ],
    phoneCount,
  }
}
