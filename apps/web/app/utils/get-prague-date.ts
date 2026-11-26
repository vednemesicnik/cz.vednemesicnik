/**
 * The calendar day in the site's civil time (Europe/Prague), so the hour before
 * midnight UTC already counts as the next day.
 *
 * @param date - The moment.
 * @returns The day as `YYYY-MM-DD`.
 */
export const getPragueDate = (date: Date): string =>
  date.toLocaleDateString('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Prague',
    year: 'numeric',
  })
