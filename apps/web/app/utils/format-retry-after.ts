/**
 * Formats a retry-after duration into a human-readable relative time string.
 *
 * Values under 60 seconds are expressed in seconds; anything longer is rounded
 * up to the nearest minute.
 *
 * @param seconds - Number of seconds until the rate-limit window resets.
 * @param locale  - BCP 47 language tag used for formatting. Defaults to `'cs'`.
 * @returns Formatted string, e.g. `"za 45 sekund"` or `"za 15 minut"`.
 *
 * @example
 * formatRetryAfter(45)        // "za 45 sekund"
 * formatRetryAfter(900)       // "za 15 minut"
 * formatRetryAfter(900, 'en') // "in 15 minutes"
 */
export const formatRetryAfter = (seconds: number, locale = 'cs') => {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })

  return seconds < 60
    ? formatter.format(seconds, 'second')
    : formatter.format(Math.ceil(seconds / 60), 'minute')
}
