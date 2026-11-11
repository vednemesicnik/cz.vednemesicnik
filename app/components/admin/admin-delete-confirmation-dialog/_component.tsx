import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
} from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { DIALOG_RETURN_VALUE } from '~/config/dialog-config'

type AdminDeleteConfirmationDialogContextValue = {
  accept: () => void
  decline: () => void
}

const Context = createContext<
  AdminDeleteConfirmationDialogContextValue | undefined
>(undefined)

type Props = {
  ref: RefObject<HTMLDialogElement | null>
  children: ReactNode
}

/**
 * Confirms a delete; closes with the accept or decline return value. The
 * caller composes it from the modal parts and ends with
 * `AdminDeleteConfirmationDialogActions`.
 *
 * @param props.children - The question (`AdminModalTitle`), what is deleted
 *   on its own line (`AdminModalSubject`, design 23f) or as a list (22c), the
 *   sentence under it (`AdminModalDescription`), then the actions.
 */
export const AdminDeleteConfirmationDialog = ({ ref, children }: Props) => {
  // Read ref.current inside the handlers, not during render: the <dialog> is
  // attached in the commit phase, so at render time ref.current is still null
  // and a captured value would never close the dialog.
  const decline = () => ref.current?.close(DIALOG_RETURN_VALUE.decline)
  const accept = () => ref.current?.close(DIALOG_RETURN_VALUE.accept)

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <Context.Provider value={{ accept, decline }}>
          {children}
        </Context.Provider>
      </AdminModalContent>
    </AdminDialog>
  )
}

/**
 * What the dialog shares with its actions: closing it as accepted or declined.
 *
 * @returns The delete confirmation dialog's context
 */
export const useAdminDeleteConfirmationDialogClose = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error(
      'useAdminDeleteConfirmationDialogClose must be used within an AdminDeleteConfirmationDialog',
    )
  }

  return context
}
