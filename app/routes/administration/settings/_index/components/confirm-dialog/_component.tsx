import type { ReactNode } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'

import { useModalDialog } from '../../utils/use-modal-dialog'
import styles from './_styles.module.css'

type Props = {
  title: string
  // What is being confirmed, under the title (e.g. which passkey).
  subject?: ReactNode
  description: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

/**
 * Confirms taking a sign-in method away — removing a passkey, turning off
 * two-factor (design 29d) — and says what it changes. Only the button in the
 * dialog is red.
 */
export const ConfirmDialog = ({
  title,
  subject,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: Props) => {
  const ref = useModalDialog(onClose)

  const handleCancel = () => ref.current?.close()
  const handleConfirm = () => {
    ref.current?.close()
    onConfirm()
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{title}</AdminModalTitle>
        {subject !== undefined && <p className={styles.subject}>{subject}</p>}
        <AdminModalDescription>{description}</AdminModalDescription>
        <AdminModalActions>
          <Button
            onClick={handleCancel}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleConfirm}
            size={'sm'}
            type={'button'}
            variant={'danger'}
          >
            {confirmLabel}
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
