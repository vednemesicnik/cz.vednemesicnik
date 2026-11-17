/**
 * Instants as the database keeps them, and as the screens say them.
 *
 * Every time the app writes is a UTC instant with milliseconds, always the same length, so the
 * database can compare them as text. Every time a person reads is Prague time.
 */

const TIME_ZONE = 'Europe/Prague'

export function now(): Temporal.Instant {
  return Temporal.Now.instant()
}

/** `2026-11-17T08:12:00.000Z`: fixed width, which is what makes text order time order. */
export function stamp(instant: Temporal.Instant): string {
  return instant.toString({ smallestUnit: 'millisecond' })
}

/** Reads a stamp back, or `null` for text that is not one. */
export function parseStamp(value: unknown): Temporal.Instant | null {
  if (typeof value !== 'string') return null
  try {
    return Temporal.Instant.from(value)
  } catch {
    return null
  }
}

function inPrague(instant: Temporal.Instant): Temporal.ZonedDateTime {
  return instant.toZonedDateTimeISO(TIME_ZONE)
}

/**
 * `ve 14:38`, `v 9:12`: the time with its preposition.
 *
 * _Ve_ before the hours 2, 3, 4, 12, 13, 14 and 20–23, _v_ otherwise. A convention of Publikace
 * (`docs/copy-context.md`), not a rule of Czech.
 */
export function atTime(instant: Temporal.Instant): string {
  let time = inPrague(instant)
  let hour = time.hour
  let preposition = [2, 3, 4, 12, 13, 14, 20, 21, 22, 23].includes(hour) ? 've' : 'v'
  return `${preposition} ${hour}:${String(time.minute).padStart(2, '0')}`
}

/** `17. 11. 2026`. */
export function formatDate(instant: Temporal.Instant): string {
  let date = inPrague(instant)
  return `${date.day}. ${date.month}. ${date.year}`
}

/** _dnes_, _včera_, or the date, as the access list says when somebody last signed in. */
export function formatDay(instant: Temporal.Instant, today: Temporal.Instant): string {
  let day = inPrague(instant).toPlainDate()
  let current = inPrague(today).toPlainDate()

  if (day.equals(current)) return 'dnes'
  if (day.equals(current.subtract({ days: 1 }))) return 'včera'
  return formatDate(instant)
}
