import { createContext, type ReactNode, useContext } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { useModalDialog } from '~/utils/use-modal-dialog'

type ConfirmDialogContextValue = {
  cancel: () => void
  confirm: () => void
}

const Context = createContext<ConfirmDialogContextValue | undefined>(undefined)

type Props = {
  onConfirm: () => void
  onClose: () => void
  children: ReactNode
}

/**
 * Confirms taking a sign-in method away — removing a passkey, turning off
 * two-factor (design 29d) — and says what it changes. Only the button in the
 * dialog is red.
 *
 * @param props.children - The title (`AdminModalTitle`, or a
 *   `ConfirmDialogHeading` with what is confirmed under it), what it changes
 *   (`AdminModalDescription`), then `ConfirmDialogActions`.
 */
export const ConfirmDialog = ({ onConfirm, onClose, children }: Props) => {
  const ref = useModalDialog(onClose)

  const cancel = () => ref.current?.close()
  const confirm = () => {
    ref.current?.close()
    onConfirm()
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <Context.Provider value={{ cancel, confirm }}>
          {children}
        </Context.Provider>
      </AdminModalContent>
    </AdminDialog>
  )
}

/**
 * What the dialog shares with its actions: cancelling and confirming.
 *
 * @returns The confirm dialog's context
 */
export const useConfirmDialog = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialog')
  }

  return context
}
