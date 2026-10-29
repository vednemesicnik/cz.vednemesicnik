import type { BulkNoun, PluralSentences } from '~/config/bulk-noun-config'
import { formatListCount } from '~/utils/format-list-count'

import { pickPluralSentence } from './pick-plural-sentence'

type Options = {
  pendingCount: number
  notSubmittedCount: number
  incompleteCount: number
  noun: BulkNoun
}

/**
 * The sentences under the bulk publish dialog's list (design 22c), each only
 * when the selection holds such a record. Waiting and not submitted count only
 * the records that will be published; incomplete ones are skipped and said
 * apart (copy bhmem1jc, s9xbwd3w, 0farrwua).
 *
 * @param options - How many of the records to publish wait for approval, and
 *   how many are not submitted; how many selected records are incomplete; the
 *   list's bulk noun.
 * @returns `notes` — „1 článek čeká na schválení. Publikováním ho schválíte.“
 *   and „2 články nejsou odeslané ke schválení.“ in one line, or `null`;
 *   `skipped` — „1 článek je neúplný. Přeskočí se.“, or `null`.
 */
export const getBulkPublishNotes = ({
  pendingCount,
  notSubmittedCount,
  incompleteCount,
  noun,
}: Options) => {
  const sentence = (count: number, predicates: PluralSentences) =>
    count === 0
      ? []
      : [
          `${formatListCount(count, noun.countForms)} ${pickPluralSentence(count, predicates)}`,
        ]

  const sentences = [
    ...sentence(pendingCount, noun.pending),
    ...sentence(notSubmittedCount, noun.notSubmitted),
  ]
  const [skipped = null] = sentence(incompleteCount, noun.incomplete)

  return {
    notes: sentences.length === 0 ? null : sentences.join(' '),
    skipped: skipped === null ? null : `${skipped} Přeskočí se.`,
  }
}
