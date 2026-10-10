import type { ReactNode } from 'react'

import { AdminButton } from '~/components/admin/admin-button'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'

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
      <AdminModalContent className={styles.content}>
        <AdminModalTitle>{title}</AdminModalTitle>
        {subject !== undefined && <p className={styles.subject}>{subject}</p>}
        <AdminModalDescription>{description}</AdminModalDescription>
        <AdminModalActions>
          <AdminButton
            onClick={handleCancel}
            type={'button'}
            variant={'secondary'}
          >
            Zrušit
          </AdminButton>
          <AdminButton
            onClick={handleConfirm}
            type={'button'}
            variant={'danger'}
          >
            {confirmLabel}
          </AdminButton>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
