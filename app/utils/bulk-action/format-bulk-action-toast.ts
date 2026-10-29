import type { BulkNoun } from '~/config/bulk-noun-config'
import { formatListCount } from '~/utils/format-list-count'

import type { BulkAction } from './get-bulk-actions'

// „Obnoveno jako koncept“: a bare „Obnoveno“ reads as back on the web (y0xq33k8).
const PARTICIPLES: Record<BulkAction, string> = {
  archive: 'archivováno',
  delete: 'smazáno',
  publish: 'publikováno',
  restore: 'obnoveno jako koncept',
  retract: 'staženo z publikace',
}

type Options = {
  action: BulkAction
  processedCount: number
  skippedCount: number
  onlyDrafts: boolean
  noun: BulkNoun
}

/**
 * The toast after a bulk action (design 22c, 2txmjnaq): *Sloveso: počet*, the
 * real result rather than the selection's size, and what was skipped.
 *
 * @param options - The action, how many records it changed and skipped,
 *   whether all of them were drafts (deleting then counts koncepty where the
 *   list does), and the list's bulk noun.
 * @returns „Publikováno: 3 články“, „Publikováno: 2 články. Přeskočeno: 1
 *   článek.“, or „Nic nebylo publikováno. Přeskočeno: 3 články.“
 */
export const formatBulkActionToast = ({
  action,
  processedCount,
  skippedCount,
  onlyDrafts,
  noun,
}: Options) => {
  const countForms =
    action === 'delete' && onlyDrafts && noun.draftCountForms !== null
      ? noun.draftCountForms
      : noun.countForms
  const formatCount = (count: number) => formatListCount(count, countForms)
  const participle = PARTICIPLES[action]
  const skipped =
    skippedCount === 0 ? '' : ` Přeskočeno: ${formatCount(skippedCount)}.`

  if (processedCount === 0) {
    return `Nic nebylo ${participle}.${skipped}`
  }

  const result = `${participle.charAt(0).toUpperCase()}${participle.slice(1)}: ${formatCount(processedCount)}`

  return skippedCount === 0 ? result : `${result}.${skipped}`
}
