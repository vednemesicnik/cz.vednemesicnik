import type { TaxonomyConflicts } from './get-taxonomy-conflicts'
import type { TaxonomyRecordCopy } from './taxonomy-record-copy'

/**
 * The field errors of a taken name or address, each at its own field (design
 * 25c): both show when both are taken.
 *
 * @param conflicts - What another record already holds.
 * @param copy - The category's or tag's words.
 * @returns Conform field errors for `submission.reply({ fieldErrors })`.
 */
export const getTaxonomyConflictErrors = (
  conflicts: TaxonomyConflicts,
  copy: Pick<TaxonomyRecordCopy, 'takenName' | 'takenSlug'>,
) => ({
  ...(conflicts.isNameTaken ? { name: [copy.takenName] } : {}),
  ...(conflicts.slugSuggestion === null ? {} : { slug: [copy.takenSlug] }),
})
