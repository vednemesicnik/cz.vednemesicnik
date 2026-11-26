import { getFreeSlugSuggestion } from '~/utils/get-free-slug-suggestion'
import { isNameTaken } from '~/utils/is-name-taken'

/** What another category or tag already holds (design 25c, s9fjeojo). */
export type TaxonomyConflicts = {
  isNameTaken: boolean
  /** A free address to offer for a taken one, `null` when the address is free. */
  slugSuggestion: string | null
}

type TaxonomyRecord = {
  name: string
  slug: string
}

/**
 * Checks a category's or tag's name and address against the other records.
 * Names compare ignoring letter case, addresses exactly.
 *
 * @param otherRecords - Every other record of the same kind.
 * @param record - The name and address being saved.
 */
export const getTaxonomyConflicts = (
  otherRecords: readonly TaxonomyRecord[],
  { name, slug }: TaxonomyRecord,
): TaxonomyConflicts => {
  const takenSlugs = otherRecords.map((otherRecord) => otherRecord.slug)

  return {
    isNameTaken: isNameTaken(
      name,
      otherRecords.map((otherRecord) => otherRecord.name),
    ),
    slugSuggestion: takenSlugs.includes(slug)
      ? getFreeSlugSuggestion(slug, takenSlugs)
      : null,
  }
}
