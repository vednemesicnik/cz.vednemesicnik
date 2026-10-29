import { useEffect, useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { DialogBody } from '~/components/dialog-body'
import type { BulkNoun } from '~/config/bulk-noun-config'
import type { BulkAction } from '~/utils/bulk-action/get-bulk-actions'
import { getBulkConfirmCopy } from '~/utils/bulk-action/get-bulk-confirm-copy'
import { useModalDialog } from '~/utils/use-modal-dialog'

import styles from './_styles.module.css'

// Over five, nobody reads the list: the dialog gives only the count (22c).
const MAX_LISTED_TITLES = 5

type Props = {
  action: BulkAction
  records: { id: string; title: string }[]
  noun: BulkNoun
  onlyDrafts: boolean
  isCreator: boolean
  hasRelated?: boolean
  notes?: string[]
  skipped: string | null
  onConfirm: () => void
  onClose: () => void
}

/**
 * Confirms a bulk action (design 22c, ji6n8th3), publishing too where a list
 * publishes without an order or a date (26f). Up to five records it lists
 * their titles. The reversible actions and publishing confirm on Enter;
 * deleting does not — the focus starts on Zrušit and the button is the danger
 * one.
 *
 * @param props.records - The records the action changes.
 * @param props.noun - The list's bulk noun, for the heading and the sentences.
 * @param props.onlyDrafts - Every one is a draft: deleting says koncepty where
 *   the list does.
 * @param props.isCreator - A Creator confirms: retracting says who publishes
 *   again.
 * @param props.hasRelated - A record has related content the action reaches
 *   (a category's articles): the sentence says what happens to it (25g).
 * @param props.notes - Publishing, the waiting, not-submitted and incomplete
 *   sentences in full ink, each only when the selection holds such a record.
 * @param props.skipped - What the action skips and why (22f), or `null`.
 */
export const BulkConfirmDialog = ({
  action,
  records,
  noun,
  onlyDrafts,
  isCreator,
  hasRelated = false,
  notes = [],
  skipped,
  onConfirm,
  onClose,
}: Props) => {
  const ref = useModalDialog(onClose)
  const { confirmLabel, descriptions, title } = getBulkConfirmCopy({
    action,
    count: records.length,
    hasRelated,
    isCreator,
    noun,
    onlyDrafts,
  })
  const isDelete = action === 'delete'
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  // After showModal (the effect above), which focuses the first button: Enter
  // confirms a reversible action, never a delete (22c).
  useEffect(() => {
    ;(isDelete ? cancelRef : confirmRef).current?.focus()
  }, [isDelete])

  const handleConfirm = () => {
    onConfirm()
    ref.current?.close()
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{title}</AdminModalTitle>
        {records.length <= MAX_LISTED_TITLES && (
          <ul className={styles.titles}>
            {records.map((record) => (
              <li key={record.id}>{record.title}</li>
            ))}
          </ul>
        )}
        {/* What happens, then its exceptions (22c, 26f). */}
        <DialogBody>
          {descriptions.map((description) =>
            isDelete && noun.deleteInFullInk ? (
              <p className={styles.note} key={description}>
                {description}
              </p>
            ) : (
              <AdminModalDescription key={description}>
                {description}
              </AdminModalDescription>
            ),
          )}
          {notes.map((note) => (
            <p className={styles.note} key={note}>
              {note}
            </p>
          ))}
          {skipped !== null && (
            <AdminModalDescription>{skipped}</AdminModalDescription>
          )}
        </DialogBody>
        <AdminModalActions>
          <Button
            onClick={() => ref.current?.close()}
            ref={cancelRef}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleConfirm}
            ref={confirmRef}
            size={'sm'}
            type={'button'}
            variant={isDelete ? 'danger' : 'primary'}
          >
            {confirmLabel}
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
