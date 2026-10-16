import { useRef } from 'react'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminSelectionBar } from '~/components/admin/admin-selection-bar'
import { Button } from '~/components/button'

import { useAdminBulkDelete } from './_hook'
import styles from './_styles.module.css'

// Over five, nobody reads the list: the dialog gives only the count (22c).
const MAX_LISTED_ITEMS = 5

/** A list's own bulk-delete confirmation (design 25g, 26f). */
export type BulkDeleteConfirmation = {
  title: string
  /** The selected records, listed only up to five. */
  items: { id: string; label: string }[]
  description: string
  confirmLabel: string
}

type Props = {
  // Route action URL (the list route itself).
  action: string
  selectedIds: string[]
  // Clear the selection after a successful submit, or on „Zrušit výběr“.
  onDone: () => void
  confirmation?: BulkDeleteConfirmation
  formatToast?: (deletedCount: number) => string
}

/**
 * The selection bar of a list whose only bulk action is delete (22c).
 *
 * @param props.confirmation - The list's own dialog text; without it the
 *   generic confirmation, for lists the design has not drawn yet.
 * @param props.formatToast - The toast after a successful delete, from the
 *   number of records actually deleted; without it no toast.
 */
export const AdminBulkActionsBar = ({
  action,
  selectedIds,
  onDone,
  confirmation,
  formatToast,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const { isSubmitting, openDialog } = useAdminBulkDelete(dialogRef, {
    action,
    formatToast,
    onDone,
    selectedIds,
  })

  return (
    <>
      {selectedIds.length > 0 && (
        <AdminSelectionBar
          className={styles.bar}
          count={selectedIds.length}
          onClear={onDone}
        >
          <Button
            disabled={isSubmitting}
            onClick={openDialog}
            size={'sm'}
            type={'button'}
            variant={'outline'}
          >
            Smazat…
          </Button>
        </AdminSelectionBar>
      )}
      {/* Keep the dialog mounted even with no selection: the hook attaches its
          `close` listener on mount, so a dialog that only appears on selection
          would never wire up and confirm would never submit. */}
      <AdminDeleteConfirmationDialog
        confirmLabel={confirmation?.confirmLabel}
        description={confirmation?.description}
        ref={dialogRef}
        title={confirmation?.title}
      >
        {confirmation !== undefined &&
          confirmation.items.length > 0 &&
          confirmation.items.length <= MAX_LISTED_ITEMS && (
            <ul className={styles.items}>
              {confirmation.items.map((item) => (
                <li key={item.id}>{item.label}</li>
              ))}
            </ul>
          )}
      </AdminDeleteConfirmationDialog>
    </>
  )
}
