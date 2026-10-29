import type { BulkAction } from '~/utils/bulk-action/get-bulk-actions'

/** The selection bar's buttons; three dots, since a dialog always follows (22c, ji6n8th3). */
export const BULK_ACTION_LABELS: Record<BulkAction, string> = {
  archive: 'Archivovat…',
  delete: 'Smazat…',
  publish: 'Publikovat…',
  restore: 'Obnovit jako koncept…',
  retract: 'Stáhnout z publikace…',
}
