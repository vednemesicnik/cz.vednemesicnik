import { formatLiveChangeLine } from '~/routes/administration/articles/_index/utils/format-live-change-line'
import type { LiveChange } from '~/routes/administration/articles/_index/utils/use-live-article-rows'

import type { DashboardSectionKind } from '../dashboard-section-kind'

type Options = {
  section: DashboardSectionKind
  contextLine: string | null
  authorLine: string
  holdLine: string | null
  factLine: string | null
  liveChange: LiveChange | undefined
  now: Date
}

/**
 * The lines of a dashboard row around its name and its tag (design 21a, 21b,
 * 22f). Under the name, what the row belongs to, and in the queue who wrote
 * it — one's own rows need no author. Under the tag, who edits it first, then
 * a change someone else made while the dashboard is open, else the list's
 * fact.
 *
 * @returns The note under the name, or `null`, and the tag's detail.
 */
export const getDashboardRowLines = ({
  section,
  contextLine,
  authorLine,
  holdLine,
  factLine,
  liveChange,
  now,
}: Options) => {
  const noteParts = [
    contextLine,
    section === 'queue' && authorLine !== '' ? authorLine : null,
  ].filter((part) => part !== null)

  const liveLine =
    liveChange === undefined || liveChange.isLineSuperseded === true
      ? null
      : formatLiveChangeLine({
          name: liveChange.name,
          now,
          occurredAt: liveChange.occurredAt,
        })

  return {
    detail: holdLine ?? liveLine ?? factLine ?? undefined,
    note: noteParts.length === 0 ? null : noteParts.join(' · '),
  }
}
