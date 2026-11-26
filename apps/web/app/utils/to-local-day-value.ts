/**
 * The local day of a date as a date input wants it; `toISOString` would give
 * the UTC day.
 *
 * @param date - The date.
 * @returns `YYYY-MM-DD` in the local time zone.
 */
export const toLocalDayValue = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
