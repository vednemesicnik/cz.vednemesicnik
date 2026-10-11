/**
 * Formats a date the way the administration shows it in the new design
 * (`14. 10. 2025`, always with the year), in the site's civil time
 * (Europe/Prague) so the day is the same on the server and in the browser.
 *
 * @param date - The date to format.
 * @returns The date as day, month and year with dots.
 */
export const formatNumericDate = (date: Date): string =>
  date.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'Europe/Prague',
    year: 'numeric',
  })
