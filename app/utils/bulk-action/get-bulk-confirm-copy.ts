import type {
  BulkNoun,
  NumberSentences,
  RelatedSentences,
} from '~/config/bulk-noun-config'
import { formatListCount } from '~/utils/format-list-count'

import type { BulkAction } from './get-bulk-actions'

type Options = {
  action: BulkAction
  count: number
  onlyDrafts: boolean
  isCreator: boolean
  hasRelated?: boolean
  noun: BulkNoun
}

const isRelatedSentences = (
  sentences: NumberSentences | RelatedSentences,
): sentences is RelatedSentences => 'withRelated' in sentences

// „Rubriky se vrátí do konceptu.“ | the rest: the Creator's sentence goes
// between (25g, 27a).
const FIRST_SENTENCE_END = '. '

const VERBS: Record<BulkAction, string> = {
  archive: 'Archivovat',
  delete: 'Smazat',
  publish: 'Publikovat',
  restore: 'Obnovit jako koncept',
  retract: 'Stáhnout z publikace',
}

/**
 * The texts of a bulk confirmation (design 22c, 26f, y0xq33k8): the heading
 * names the verb and the count, the button the same without the question mark.
 * Retracting tells a Creator that only the Coordinator publishes again (23e),
 * in its own paragraph or right after the first sentence, as the list draws it.
 * Publishing says where the records appear, for a list that publishes without
 * an order (26f); the articles' ordered dialog has its own words. Where the
 * records' related content changes what happens (a category's articles, 25g),
 * the sentence follows whether any selected record has it.
 *
 * @param options - The action, how many records it changes, whether all of
 *   them are drafts (deleting then says koncepty where the list does), whether
 *   a Creator confirms, whether a selected record has related content the
 *   action reaches, and the list's bulk noun.
 * @returns `title`, `confirmLabel`, and `descriptions` in reading order.
 */
export const getBulkConfirmCopy = ({
  action,
  count,
  onlyDrafts,
  isCreator,
  hasRelated = false,
  noun,
}: Options) => {
  const objectForms =
    action === 'delete' && onlyDrafts && noun.draftCountForms !== null
      ? noun.draftCountForms
      : noun.objectForms
  const label = `${VERBS[action]} ${formatListCount(count, objectForms)}`
  const byCount = (sentences: NumberSentences) =>
    count === 1 ? sentences.one : sentences.many

  const sentences = noun.descriptions[action]

  if (sentences === null) {
    return { confirmLabel: label, descriptions: [], title: `${label}?` }
  }

  const description = byCount(
    isRelatedSentences(sentences)
      ? hasRelated
        ? sentences.withRelated
        : sentences.withoutRelated
      : sentences,
  )

  if (action !== 'retract' || !isCreator) {
    return {
      confirmLabel: label,
      descriptions: [description],
      title: `${label}?`,
    }
  }

  const creatorSentence = byCount(noun.creatorRetract)
  const firstEnd = description.indexOf(FIRST_SENTENCE_END)
  // A one-sentence description takes it at its end (gzumlpu2).
  const descriptions = !noun.creatorAfterFirstSentence
    ? [description, creatorSentence]
    : firstEnd === -1
      ? [`${description} ${creatorSentence}`]
      : [
          `${description.slice(0, firstEnd + 1)} ${creatorSentence} ${description.slice(firstEnd + FIRST_SENTENCE_END.length)}`,
        ]

  return { confirmLabel: label, descriptions, title: `${label}?` }
}
