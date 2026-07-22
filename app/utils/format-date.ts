type FormatDateOptions = {
  locale?: string // default 'cs-CZ' — future i18n passes the URL-derived locale
}

// Publication dates are editorial data: every reader sees the day the editor picked,
// so formatting is fixed to the site's civil time (Europe/Prague), independent of the
// server's and the visitor's timezone.
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
  iso: string | null // machine value — picker seeds, <time dateTime>
  formatted: string // display value — '...' for null
}

export const createFormattedDate = (
  date: Date | null,
  options?: FormatDateOptions,
): FormattedDate => {
  return {
    formatted: formatDate(date, options),
    iso: date?.toISOString() ?? null,
  }
}
