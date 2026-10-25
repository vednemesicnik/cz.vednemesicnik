import type { BulkDeleteConfirmation } from '~/components/admin/admin-bulk-actions-bar'

import { AUTHOR_RECORD_COPY } from '../../author-record-copy'

/**
 * The author list's bulk-delete confirmation (design 28g, h2twqjee; copy
 * 0t7rbimg): the count in the title and the button, the authors by name. Only
 * an author nothing holds is selectable, so no name carries a count.
 *
 * @param authors - The selected authors, in the list's order.
 * @returns „Smazat 3 autory?“ with the names and the sentence for the count.
 */
export const getAuthorBulkDeleteConfirmation = (
  authors: { id: string; name: string }[],
): BulkDeleteConfirmation => {
  const count = AUTHOR_RECORD_COPY.bulkDelete.count(authors.length)

  return {
    confirmLabel: `Smazat ${count}`,
    description: AUTHOR_RECORD_COPY.bulkDelete.description(authors.length),
    items: authors.map(({ id, name }) => ({ id, label: name })),
    title: `Smazat ${count}?`,
  }
}
