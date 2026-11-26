import type { LiveChange } from '~/hooks/use-live-changes'

import { formatLiveChangeLine } from './format-live-change-line'

type Options = {
  holdLine?: string | null
  factLine: string | null
  liveChange: LiveChange | undefined
  now: Date
}

/**
 * The line under a row's state tag (design 22f, xkg6rdz4), on every list and
 * the dashboard alike: who edits it first, then a change someone else made
 * while the page is open, else the row's fact.
 *
 * @param options.holdLine - Who edits it; a list without an edit hold has none.
 * @param options.factLine - The row's one fact (22b).
 * @param options.liveChange - A change someone else made while the page is
 *   open; once an edit hold came after it, the fact is newer.
 * @param options.now - The moment of rendering, which decides the day.
 * @returns The line, or `undefined` for none.
 */
export const getLiveStateDetail = ({
  holdLine,
  factLine,
  liveChange,
  now,
}: Options) => {
  const liveLine =
    liveChange === undefined || liveChange.isLineSuperseded === true
      ? null
      : formatLiveChangeLine({
          name: liveChange.name,
          now,
          occurredAt: liveChange.occurredAt,
        })

  return holdLine ?? liveLine ?? factLine ?? undefined
}
