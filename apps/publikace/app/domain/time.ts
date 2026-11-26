/**
 * Instants as the database keeps them, and as the screens say them.
 *
 * Every time the app writes is a UTC instant with milliseconds, always the same length, so the
 * database can compare them as text. Every time a person reads is Prague time.
 */

import { keepOneLetterWords } from './public/typography.ts'

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
 * (`docs/copy-context.md`), not a rule of Czech. A lone _v_ stays with its time, as every
 * one-letter word on the screens does.
 */
export function atTime(instant: Temporal.Instant): string {
  let hour = inPrague(instant).hour
  let preposition = [2, 3, 4, 12, 13, 14, 20, 21, 22, 23].includes(hour) ? 've' : 'v'
  return keepOneLetterWords(`${preposition} ${clockTime(instant)}`)
}

/*
 * The hours and the days before which _z_ reads as _ze_: a convention of Publikace, as `atTime`'s
 * hours are (copy `9gje14lt`).
 */
const FROM_ZE_HOURS: readonly number[] = [2, 3, 4, 6, 7, 12, 13, 14, 16, 17, 20, 21, 22, 23]
const FROM_ZE_DAYS: readonly number[] = [
  2, 3, 4, 6, 7, 12, 13, 14, 16, 17, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
]

/**
 * `z 9:12` today, `ze 22. 11. v 9:12` on another day and with the year in another year: when
 * something started, as _čtení z ‹čas›_ has it (`13i`). _Ze_ follows how the number after it is
 * read, as `atTime` picks _ve_.
 */
export function fromMoment(instant: Temporal.Instant, today: Temporal.Instant): string {
  let time = inPrague(instant)
  if (formatDay(instant, today) === 'dnes') {
    let preposition = FROM_ZE_HOURS.includes(time.hour) ? 'ze' : 'z'
    return keepOneLetterWords(`${preposition} ${clockTime(instant)}`)
  }
  let preposition = FROM_ZE_DAYS.includes(time.day) ? 'ze' : 'z'
  return keepOneLetterWords(`${preposition} ${formatMoment(instant, today)}`)
}

/** `9:30`, as after _kolem_. */
export function clockTime(instant: Temporal.Instant): string {
  let time = inPrague(instant)
  return `${time.hour}:${String(time.minute).padStart(2, '0')}`
}

/** `14. 11. v 8:30` in the year of `today`, `14. 11. 2025 v 8:30` in another (`00e`). */
export function formatMoment(instant: Temporal.Instant, today: Temporal.Instant): string {
  let date =
    pragueYear(instant) === pragueYear(today) ? formatDayMonth(instant) : formatDate(instant)
  return `${date} ${atTime(instant)}`
}

/** `17. 11. 2026`. */
export function formatDate(instant: Temporal.Instant): string {
  let date = inPrague(instant)
  return `${date.day}. ${date.month}. ${date.year}`
}

/** `14. 9.`: the date without its year, where a short line has no room for it (`11e`). */
export function formatDayMonth(instant: Temporal.Instant): string {
  let date = inPrague(instant)
  return `${date.day}. ${date.month}.`
}

/** The year in Prague, which is the year an issue is numbered in. */
export function pragueYear(instant: Temporal.Instant): number {
  return inPrague(instant).year
}

/** _dnes_, _včera_, or the date, as the access list says when somebody last signed in. */
export function formatDay(instant: Temporal.Instant, today: Temporal.Instant): string {
  let day = inPrague(instant).toPlainDate()
  let current = inPrague(today).toPlainDate()

  if (day.equals(current)) return 'dnes'
  if (day.equals(current.subtract({ days: 1 }))) return 'včera'
  return formatDate(instant)
}
