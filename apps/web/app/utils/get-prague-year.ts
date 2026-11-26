/**
 * The calendar year in the site's civil time (Europe/Prague), so New Year's
 * Eve after 23:00 UTC already counts as the next year.
 *
 * @param date - The moment.
 * @returns The year, e.g. `2026`.
 */
export const getPragueYear = (date: Date): number =>
  Number(
    date.toLocaleDateString('en-GB', {
      timeZone: 'Europe/Prague',
      year: 'numeric',
    }),
  )
