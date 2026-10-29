import { FORM_CONFIG } from '~/config/form-config'
import type { BulkAction } from '~/utils/bulk-action/get-bulk-actions'

const INTENT_VALUE = FORM_CONFIG.intent.value

/** The intent each bulk action submits as (design 22c, ji6n8th3). */
export const BULK_ACTION_INTENTS: Record<BulkAction, string> = {
  archive: INTENT_VALUE.bulkArchive,
  delete: INTENT_VALUE.bulkDelete,
  publish: INTENT_VALUE.bulkPublish,
  restore: INTENT_VALUE.bulkRestore,
  retract: INTENT_VALUE.bulkRetract,
}
