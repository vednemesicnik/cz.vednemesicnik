import { formatNumericDate } from '~/utils/format-numeric-date'
import { formatTime } from '~/utils/format-time'

type Options = {
  name: string
  occurredAt: Date
  now: Date
}

/**
 * The supplementary line of a row changed live by someone else (design 22f,
 * 2txmjnaq). It stands in for the 22b fact until the list is left.
 *
 * @param options.name - The author who made the change.
 * @param options.now - The moment of rendering, which decides the day.
 * @returns `změna 14:02 · Jakub Novák`; after the day changes,
 *   `změna 1. 10. 2026 · Jakub Novák`.
 */
export const formatLiveChangeLine = ({ name, occurredAt, now }: Options) => {
  const when =
    formatNumericDate(occurredAt) === formatNumericDate(now)
      ? formatTime(occurredAt)
      : formatNumericDate(occurredAt)

  return `změna ${when} · ${name}`
}
