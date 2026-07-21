import { useEffect, useRef } from 'react'
import type { Blocker } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'

type Props = {
  blocker: Blocker
  // Runs on confirmed leave — write the backup, then call blocker.proceed().
  onConfirmLeave: () => void
}

// Confirms leaving a dirty article form. Driven by the router blocker: opens
// while blocked and closes otherwise. Every dismissal that isn't a confirmed
// leave resets the blocker so navigation isn't stuck.
export const AdminLeaveConfirmationDialog = ({
  blocker,
  onConfirmLeave,
}: Props) => {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog === null) return

    if (blocker.state === 'blocked' && !dialog.open) {
      dialog.showModal()
    } else if (blocker.state !== 'blocked' && dialog.open) {
      dialog.close()
    }
  }, [blocker.state])

  // Esc dismissal fires a native `cancel` event (React's onCancel/onClose props
  // don't fire reliably here — the delete dialog uses native listeners too).
  useEffect(() => {
    const dialog = ref.current
    if (dialog === null) return

    const handleCancel = () => {
      if (blocker.state === 'blocked') blocker.reset()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [blocker])

  const handleStay = () => {
    ref.current?.close()
    if (blocker.state === 'blocked') blocker.reset()
  }

  const handleLeave = () => {
    ref.current?.close()
    onConfirmLeave()
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Máte neuložené změny</AdminModalTitle>
        <AdminModalDescription>
          Rozpracovaný obsah se uloží do prohlížeče a můžete se k němu později
          vrátit.
        </AdminModalDescription>
        <AdminModalActions>
          <AdminButton
            onClick={handleStay}
            type={'button'}
            variant={'secondary'}
          >
            Zůstat
          </AdminButton>
          <AdminButton onClick={handleLeave} type={'button'} variant={'danger'}>
            Odejít
          </AdminButton>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
