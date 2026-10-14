import { formatArticleCount } from '~/utils/format-article-count'
import { formatDraftCount } from '~/utils/format-draft-count'

import type { BulkAction } from './get-bulk-actions'

const PARTICIPLES: Record<BulkAction, string> = {
  archive: 'archivováno',
  delete: 'smazáno',
  publish: 'publikováno',
}

type Options = {
  action: BulkAction
  processedCount: number
  skippedCount: number
  onlyDrafts: boolean
}

/**
 * The toast after a bulk action (design 22c, 2txmjnaq): *Sloveso: počet*, the
 * real result rather than the selection's size, and what was skipped.
 *
 * @param options - The action, how many articles it changed and skipped, and
 *   whether all of them were drafts (deleting then counts koncepty).
 * @returns „Publikováno: 3 články“, „Publikováno: 2 články. Přeskočeno: 1
 *   článek.“, or „Nic nebylo publikováno. Přeskočeno: 3 články.“
 */
export const formatBulkActionToast = ({
  action,
  processedCount,
  skippedCount,
  onlyDrafts,
}: Options) => {
  const formatCount =
    action === 'delete' && onlyDrafts ? formatDraftCount : formatArticleCount
  const participle = PARTICIPLES[action]
  const skipped =
    skippedCount === 0 ? '' : ` Přeskočeno: ${formatCount(skippedCount)}.`

  if (processedCount === 0) {
    return `Nic nebylo ${participle}.${skipped}`
  }

  const result = `${participle.charAt(0).toUpperCase()}${participle.slice(1)}: ${formatCount(processedCount)}`

  return skippedCount === 0 ? result : `${result}.${skipped}`
}
