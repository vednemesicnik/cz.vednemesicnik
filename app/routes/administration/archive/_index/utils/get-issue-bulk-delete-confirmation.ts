import type { BulkDeleteConfirmation } from '~/components/admin/admin-bulk-actions-bar'
import { ISSUE_NOUN } from '~/config/list-noun-config'
import { formatListCount } from '~/utils/format-list-count'

/**
 * The archive's bulk-delete confirmation (design 26f, qjv38ti4, sjbpskpf; copy
 * yzyd9p1l): the
 * count in the title and the button, the issues by their label. The sentence
 * names no cover or PDF — a draft may have neither — and agrees with one issue.
 *
 * @param issues - The selected issues, in the list's order.
 */
export const getIssueBulkDeleteConfirmation = (
  issues: { id: string; label: string }[],
): BulkDeleteConfirmation => {
  const count = formatListCount(issues.length, ISSUE_NOUN.countForms)

  return {
    confirmLabel: `Smazat ${count}`,
    description:
      issues.length === 1
        ? 'Smažou se i jeho nahrané soubory. Vrátit to nejde.'
        : 'Smažou se i jejich nahrané soubory. Vrátit to nejde.',
    items: issues.map(({ id, label }) => ({ id, label })),
    title: `Smazat ${count}?`,
  }
}
