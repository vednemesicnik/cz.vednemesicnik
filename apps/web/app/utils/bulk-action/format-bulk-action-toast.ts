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
  hasRelated?: boolean
  noun: BulkNoun
}

/**
 * The toast after a bulk action (design 22c, 2txmjnaq): *Sloveso: počet*, the
 * real result rather than the selection's size, what went off the web with it
 * where the list says so (27a, 0farrwua), and what was skipped.
 *
 * @param options - The action, how many records it changed and skipped,
 *   whether all of them were drafts (deleting then counts koncepty where the
 *   list does), whether a changed one had published related content, and the
 *   list's bulk noun.
 * @returns „Publikováno: 3 články“, „Publikováno: 2 články. Přeskočeno: 1
 *   článek.“, „Staženo z publikace: 2 podcasty. Z webu zmizely i jejich
 *   publikované epizody.“, „Nic nebylo publikováno. Přeskočeno: 3 články.“,
 *   or „Nic nebylo smazáno“.
 */
export const formatBulkActionToast = ({
  action,
  processedCount,
  skippedCount,
  onlyDrafts,
  hasRelated = false,
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

  // One sentence goes without a period, as the result does (28g).
  if (processedCount === 0) {
    return skipped === ''
      ? `Nic nebylo ${participle}`
      : `Nic nebylo ${participle}.${skipped}`
  }

  const result = `${participle.charAt(0).toUpperCase()}${participle.slice(1)}: ${formatCount(processedCount)}`
  const relatedSentences =
    action === 'retract' && hasRelated ? noun.relatedToast.retract : undefined
  const related =
    relatedSentences === undefined
      ? ''
      : ` ${processedCount === 1 ? relatedSentences.one : relatedSentences.many}`

  return skippedCount === 0 && related === ''
    ? result
    : `${result}.${related}${skipped}`
}
