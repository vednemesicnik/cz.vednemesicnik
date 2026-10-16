import { useRef } from 'react'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminSelectionBar } from '~/components/admin/admin-selection-bar'
import { Button } from '~/components/button'

import { useAdminBulkDelete } from './_hook'
import styles from './_styles.module.css'

type Props = {
  // Route action URL (the list route itself).
  action: string
  selectedIds: string[]
  // Clear the selection after a successful submit, or on „Zrušit výběr“.
  onDone: () => void
}

export const AdminBulkActionsBar = ({ action, selectedIds, onDone }: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const { isSubmitting, openDialog } = useAdminBulkDelete(dialogRef, {
    action,
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
      <AdminDeleteConfirmationDialog ref={dialogRef} />
    </>
  )
}
