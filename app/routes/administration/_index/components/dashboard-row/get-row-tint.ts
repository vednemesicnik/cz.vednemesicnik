import type { TableRowTint } from '~/components/admin/admin-table'
import type { LiveChange } from '~/routes/administration/articles/_index/utils/use-live-article-rows'

/**
 * The 22f tint of a row someone else changed; a tint held back for a hidden
 * tab has none yet.
 *
 * @param liveChange - The row's live change, if any.
 * @returns The tint, or `undefined`.
 */
export const getRowTint = (
  liveChange: LiveChange | undefined,
): TableRowTint | undefined =>
  liveChange?.tintStartedAt == null
    ? undefined
    : { sequence: liveChange.sequence, startedAt: liveChange.tintStartedAt }
