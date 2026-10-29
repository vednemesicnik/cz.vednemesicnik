import type { LiveChange } from '~/hooks/use-live-changes'
import { getLiveStateDetail } from '~/utils/live-change/get-live-state-detail'

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
 * @param options.section - The section the row stands in.
 * @param options.contextLine - What the row belongs to: an episode's podcast,
 *   an issue's order.
 * @param options.authorLine - Who wrote it.
 * @param options.holdLine - Who edits it, if anyone.
 * @param options.factLine - The list's fact under the tag.
 * @param options.liveChange - A change someone else made while the dashboard
 *   is open.
 * @param options.now - The moment of rendering, which decides the day.
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

  return {
    detail: getLiveStateDetail({ factLine, holdLine, liveChange, now }),
    note: noteParts.length === 0 ? null : noteParts.join(' · '),
  }
}
