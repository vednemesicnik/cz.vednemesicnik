import type { BulkDeleteConfirmation } from '~/components/admin/admin-bulk-actions-bar'
import { formatArticleCount } from '~/utils/format-article-count'

import type { TaxonomyRecordCopy } from './taxonomy-record-copy'

type TaxonomyRecord = { id: string; name: string; articleCount: number }

/**
 * The bulk-delete confirmation of categories or tags (design 25g, sjbpskpf;
 * copy inhy7os8). Each record carries its own count of assigned articles: a
 * sum would count an article with two of the selected records twice.
 *
 * @param records - The selected records, in the list's order.
 * @param copy - The category's or the tag's words.
 * @returns „Smazat 3 rubriky?“ with „Ankety (3 články)“ in the list, and the
 *   sentence with or without articles.
 */
export const getTaxonomyBulkDeleteConfirmation = (
  records: TaxonomyRecord[],
  copy: TaxonomyRecordCopy,
): BulkDeleteConfirmation => {
  const count = copy.bulkDelete.count(records.length)

  return {
    confirmLabel: `Smazat ${count}`,
    description: copy.bulkDelete.description({
      count: records.length,
      hasArticles: records.some((record) => record.articleCount > 0),
    }),
    items: records.map((record) => ({
      id: record.id,
      label:
        record.articleCount === 0
          ? record.name
          : `${record.name} (${formatArticleCount(record.articleCount)})`,
    })),
    title: `Smazat ${count}?`,
  }
}
