import { createContext, type ReactNode, useContext, useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { useModalDialog } from '~/utils/use-modal-dialog'

type UploadConfirmDialogContextValue = {
  stay: () => void
  confirm: () => void
}

const Context = createContext<UploadConfirmDialogContextValue | undefined>(
  undefined,
)

type Props = {
  onConfirm: () => void
  /** Closed any way but the confirm button; Esc too. */
  onStay: () => void
  children: ReactNode
}

/**
 * Asks over the profile before closing it, saving it or leaving Nastavení
 * cancels the photo's upload (design 29b, yyxgpzr2, o9j577ga; copy axz8tav5).
 * The caller recomputes its words when the upload ends; it never closes by
 * itself.
 *
 * @param props.children - The title (`AdminModalTitle`), the body's paragraphs
 *   in a `DialogBody`, then `AdminModalActions` with `UploadConfirmDialogStay`
 *   and `UploadConfirmDialogConfirm`.
 */
export const UploadConfirmDialog = ({ onConfirm, onStay, children }: Props) => {
  // The native close comes after the confirm, maybe after a re-render.
  const isConfirmingRef = useRef(false)
  const ref = useModalDialog(() => {
    if (!isConfirmingRef.current) onStay()
  })

  const stay = () => ref.current?.close()
  const confirm = () => {
    isConfirmingRef.current = true
    ref.current?.close()
    onConfirm()
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <Context.Provider value={{ confirm, stay }}>
          {children}
        </Context.Provider>
      </AdminModalContent>
    </AdminDialog>
  )
}

/**
 * What the dialog shares with its buttons: staying and confirming.
 *
 * @returns The upload confirm dialog's context
 */
export const useUploadConfirmDialog = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error(
      'useUploadConfirmDialog must be used within an UploadConfirmDialog',
    )
  }

  return context
}
