/**
 * A detail's row on a phone (design 24f): the first name and how many more,
 * e.g. *Kultura +2*.
 *
 * @param names - The names, in their order.
 * @returns The summary, or `—` without any.
 */
export const formatFirstNameAndCount = (names: string[]): string => {
  const [firstName, ...otherNames] = names

  if (firstName === undefined) return '—'

  return otherNames.length === 0
    ? firstName
    : `${firstName} +${otherNames.length}`
}
