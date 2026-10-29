import type { BulkAction } from './get-bulk-actions'

/**
 * What a list's bulk action answers (design 22c): the action, how many records
 * it changed and how many it skipped, whether all of them were drafts, and
 * whether a changed one had published related content (a podcast's episodes,
 * 27a) the toast then names.
 */
export type BulkActionResult = {
  action: BulkAction
  processedCount: number
  skippedCount: number
  onlyDrafts: boolean
  hasRelated: boolean
}
