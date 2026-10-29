import type { BulkNoun } from '~/config/bulk-noun-config'
import { formatListCount } from '~/utils/format-list-count'

import type { BulkAction } from './get-bulk-actions'

/** A bulk action confirmed by the plain dialog; publishing has its own. */
export type ConfirmedBulkAction = Exclude<BulkAction, 'publish'>

type Options = {
  action: ConfirmedBulkAction
  count: number
  onlyDrafts: boolean
  isCreator: boolean
  noun: BulkNoun
}

const VERBS: Record<ConfirmedBulkAction, string> = {
  archive: 'Archivovat',
  delete: 'Smazat',
  restore: 'Obnovit jako koncept',
  retract: 'Stáhnout z publikace',
}

/**
 * The texts of a bulk confirmation (design 22c, y0xq33k8): the heading names
 * the verb and the count, the button the same without the question mark.
 * Retracting tells a Creator that only the Coordinator publishes again (23e).
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

  const descriptions =
    action === 'delete'
      ? [noun.descriptions.delete]
      : action === 'retract' && isCreator
        ? [byCount(noun.descriptions.retract), byCount(noun.creatorRetract)]
        : [byCount(noun.descriptions[action])]

  return { confirmLabel: label, descriptions, title: `${label}?` }
}
