/**
 * The year an issue is in, as the archive groups it (design 26a): the year of
 * its release in the editorial timezone, as `get-issue-data.ts` derives it, so
 * a release at Prague's New Year's midnight is not the previous year.
 *
 * @param releasedAt - The issue's release date.
 * @returns The year, `2026`.
 */
export const getIssueYear = (releasedAt: Date): string =>
  releasedAt.toLocaleDateString('cs-CZ', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
  })
