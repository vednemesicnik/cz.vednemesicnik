import type { BulkNoun } from '~/config/bulk-noun-config'
import { formatListCount } from '~/utils/format-list-count'

import type { BulkAction } from './get-bulk-actions'

type DialogRecord = {
  id: string
  title: string
  related?: { count: number; publishedCount: number }
}

/**
 * How a bulk dialog lists its records (design 25g, 27a, sjbpskpf): each title
 * with the related content the action reaches beside it — „Kultura (18
 * publikovaných článků)“, every assigned article when deleting — and no
 * brackets at zero. Each count stands at its record: a sum would count an
 * article with two selected categories twice.
 *
 * @param records - The records the dialog changes, with their related counts.
 * @param action - The dialog's action.
 * @param noun - The list's bulk noun; `related` says which count an action
 *   lists.
 * @returns `records` with their dialog titles, and `hasRelated` — whether any
 *   of them has the counted content, which decides the sentence.
 */
export const getBulkDialogRecords = (
  records: DialogRecord[],
  action: BulkAction,
  noun: BulkNoun,
) => {
  const listed =
    action === 'retract' || action === 'archive' || action === 'delete'
      ? noun.related?.listedFor[action]
      : undefined

  if (noun.related === null || listed === undefined) {
    return {
      hasRelated: false,
      records: records.map(({ id, title }) => ({ id, title })),
    }
  }

  const { countForms, publishedCountForms } = noun.related
  const countOf = (record: DialogRecord) =>
    listed === 'all'
      ? (record.related?.count ?? 0)
      : (record.related?.publishedCount ?? 0)

  return {
    hasRelated: records.some((record) => countOf(record) > 0),
    records: records.map((record) => {
      const count = countOf(record)

      return {
        id: record.id,
        title:
          count === 0
            ? record.title
            : `${record.title} (${formatListCount(
                count,
                listed === 'all' ? countForms : publishedCountForms,
              )})`,
      }
    }),
  }
}
