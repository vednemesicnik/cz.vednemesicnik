import type { BulkNoun } from '~/config/bulk-noun-config'
import { formatListCount } from '~/utils/format-list-count'

import type { BulkAction } from './get-bulk-actions'

type Options = {
  action: BulkAction
  count: number
  onlyDrafts: boolean
  isCreator: boolean
  noun: BulkNoun
}

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
 * Retracting tells a Creator that only the Coordinator publishes again (23e).
 * Publishing says where the records appear, for a list that publishes without
 * an order (26f); the articles' ordered dialog has its own words.
 *
 * @param options - The action, how many records it changes, whether all of
 *   them are drafts (deleting then says koncepty where the list does), whether
 *   a Creator confirms, and the list's bulk noun.
 * @returns `title`, `confirmLabel`, and `descriptions` in reading order.
 */
export const getBulkConfirmCopy = ({
  action,
  count,
  onlyDrafts,
  isCreator,
  noun,
}: Options) => {
  const objectForms =
    action === 'delete' && onlyDrafts && noun.draftCountForms !== null
      ? noun.draftCountForms
      : noun.objectForms
  const label = `${VERBS[action]} ${formatListCount(count, objectForms)}`
  const byCount = (sentences: { one: string; many: string }) =>
    count === 1 ? sentences.one : sentences.many

  const description = noun.descriptions[action]
  const descriptions =
    description === null
      ? []
      : action === 'retract' && isCreator
        ? [byCount(description), byCount(noun.creatorRetract)]
        : [byCount(description)]

  return { confirmLabel: label, descriptions, title: `${label}?` }
}
