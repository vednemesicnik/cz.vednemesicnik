type FormatDateOptions = {
  locale?: string
}

/**
 * Formats a date for display in the site's civil time (Europe/Prague), independent
 * of the server's and the visitor's timezone, so the shown day is stable everywhere.
 * This matters most for editorial publication dates, where the reader must see the
 * exact day the editor picked.
 *
 * @param options - Optional `locale` (defaults to `'cs-CZ'`; future i18n passes the
 *   URL-derived locale).
 * @returns The localized date, or `'...'` when `date` is `null`.
 */
export const formatDate = (
  date: Date | null,
  options?: FormatDateOptions,
): string => {
  if (date === null) {
    return '...'
  }

  return date.toLocaleDateString(options?.locale ?? 'cs-CZ', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Prague',
    year: 'numeric',
  })
}

export type FormattedDate = {
  iso: string | null
  formatted: string
}

/**
 * Builds the {@link FormattedDate} that carries a date across the loader → UI boundary.
 *
 * @param options - Optional `locale`, forwarded to {@link formatDate}.
 * @returns `iso` — the machine value that seeds date pickers and `<time dateTime>`,
 *   or `null` when `date` is `null`; `formatted` — the display value, `'...'` when
 *   `date` is `null`.
 */
export const createFormattedDate = (
  date: Date | null,
  options?: FormatDateOptions,
): FormattedDate => {
  return {
    formatted: formatDate(date, options),
    iso: date?.toISOString() ?? null,
  }
}
