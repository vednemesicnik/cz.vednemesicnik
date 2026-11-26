/**
 * Suggests a free address for a taken one (design 24d, 25c): the first of
 * `{slug}-2`, `{slug}-3`, … that no record has.
 *
 * @param slug - The taken address.
 * @param takenSlugs - The addresses other records hold; those starting with
 *   `slug` are enough.
 * @returns The first free numbered address.
 */
export const getFreeSlugSuggestion = (
  slug: string,
  takenSlugs: readonly string[],
): string => {
  const taken = new Set(takenSlugs)
  let number = 2

  while (taken.has(`${slug}-${number}`)) {
    number += 1
  }

  return `${slug}-${number}`
}
