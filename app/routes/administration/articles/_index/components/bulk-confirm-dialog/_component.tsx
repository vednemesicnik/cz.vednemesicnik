import { useEffect, useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { DialogBody } from '~/components/dialog-body'
import { useModalDialog } from '~/utils/use-modal-dialog'

import { getBulkConfirmCopy } from '../../utils/get-bulk-confirm-copy'

import styles from './_styles.module.css'

// Over five, nobody reads the list: the dialog gives only the count (22c).
const MAX_LISTED_TITLES = 5

type Props = {
  action: 'archive' | 'delete'
  articles: { id: string; title: string }[]
  onlyDrafts: boolean
  skipped: string | null
  onConfirm: () => void
  onClose: () => void
}

/**
 * Confirms a bulk archive or delete (design 22c). Up to five articles it lists
 * their titles. Archiving confirms on Enter; deleting does not — the focus
 * starts on Zrušit and the button is the danger one.
 *
 * @param props.articles - The articles the action changes.
 * @param props.onlyDrafts - Every one is a draft: deleting says koncepty.
 * @param props.skipped - What the action skips and why (22f), or `null`.
 */
export const BulkConfirmDialog = ({
  action,
  articles,
  onlyDrafts,
  skipped,
  onConfirm,
  onClose,
}: Props) => {
  const ref = useModalDialog(onClose)
  const { confirmLabel, description, title } = getBulkConfirmCopy({
    action,
    count: articles.length,
    onlyDrafts,
  })
  const isDelete = action === 'delete'
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  // After showModal (the effect above), which focuses the first button: Enter
  // confirms an archive, never a delete (22c).
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
        {articles.length <= MAX_LISTED_TITLES && (
          <ul className={styles.titles}>
            {articles.map((article) => (
              <li key={article.id}>{article.title}</li>
            ))}
          </ul>
        )}
        <DialogBody>
          {skipped !== null && (
            <AdminModalDescription>{skipped}</AdminModalDescription>
          )}
          {isDelete ? (
            <p className={styles.warning}>{description}</p>
          ) : (
            <AdminModalDescription>{description}</AdminModalDescription>
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
