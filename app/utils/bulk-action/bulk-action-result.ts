import type { BulkAction } from './get-bulk-actions'

/**
 * What a list's bulk action answers (design 22c): the action, how many records
 * it changed and how many it skipped, and whether all of them were drafts.
 */
export type BulkActionResult = {
  action: BulkAction
  processedCount: number
  skippedCount: number
  onlyDrafts: boolean
}
