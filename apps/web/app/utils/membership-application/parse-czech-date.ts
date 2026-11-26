const CZECH_DATE = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/

const EARLIEST_YEAR = 1900

/**
 * Reads a date as a Czech person writes it: `14. 5. 2009`, `14.5.2009` or
 * `14.05.2009`.
 *
 * @param value - The text from the field.
 * @returns The day as `YYYY-MM-DD`, or `null` when it is not a real day.
 */
export const parseCzechDate = (value: string): string | null => {
  const match = CZECH_DATE.exec(value.trim())
  if (match === null) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (year < EARLIEST_YEAR) return null

  const date = new Date(Date.UTC(year, month - 1, day))
  const isRealDay =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day

  return isRealDay ? date.toISOString().slice(0, 10) : null
}
