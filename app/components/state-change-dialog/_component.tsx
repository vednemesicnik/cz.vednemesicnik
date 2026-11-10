import { createContext, type ReactNode, useContext } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { useModalDialog } from '~/utils/use-modal-dialog'

type StateChangeDialogContextValue = {
  action: string
  fetcherKey: string
  intent: string
  close: () => void
}

const Context = createContext<StateChangeDialogContextValue | undefined>(
  undefined,
)

type Props = {
  action: string
  fetcherKey: string
  intent: string
  onClose: () => void
  children: ReactNode
}

/**
 * Confirms a state change of one record — publish, retract, archive (designs
 * 23e, 25d, 26b, 27a, 27b). The caller composes the heading and the sentences
 * from the modal parts and ends with `StateChangeDialogActions`, which submits
 * the intent through the fetcher and closes. Opens as it mounts.
 *
 * @param props.action - The route the intent posts to.
 * @param props.fetcherKey - The fetcher the caller reads the result from.
 * @param props.intent - The state change the confirmation submits.
 * @param props.children - The title, the record, what the change does, then
 *   `StateChangeDialogActions`.
 */
export const StateChangeDialog = ({
  action,
  fetcherKey,
  intent,
  onClose,
  children,
}: Props) => {
  const ref = useModalDialog(onClose)
  const close = () => ref.current?.close()

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <Context.Provider value={{ action, close, fetcherKey, intent }}>
          {children}
        </Context.Provider>
      </AdminModalContent>
    </AdminDialog>
  )
}

/**
 * What the dialog shares with its actions: where and what they submit, and
 * how to close it.
 *
 * @returns The state change dialog's context
 */
export const useStateChangeDialog = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error(
      'useStateChangeDialog must be used within a StateChangeDialog',
    )
  }

  return context
}
