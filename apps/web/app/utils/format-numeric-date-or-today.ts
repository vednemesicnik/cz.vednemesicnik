import { formatNumericDate } from '~/utils/format-numeric-date'

/**
 * A date as the administration shows it, with today read as „dnes“ (design
 * 24e, 28d).
 *
 * @param date - The date to format.
 * @param now - The current time, which decides „dnes“.
 * @returns „dnes“, another day „25. 9. 2026“.
 */
export const formatNumericDateOrToday = (date: Date, now: Date) =>
  formatNumericDate(date) === formatNumericDate(now)
    ? 'dnes'
    : formatNumericDate(date)
