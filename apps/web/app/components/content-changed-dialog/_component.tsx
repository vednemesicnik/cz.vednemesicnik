import { createContext, type ReactNode, useContext, useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { useModalDialog } from '~/utils/use-modal-dialog'

type ContentChangedDialogContextValue = {
  canReload: boolean
  leave: () => void
}

const Context = createContext<ContentChangedDialogContextValue | undefined>(
  undefined,
)

type Props = {
  /** Free and still an editable draft: the current version can be loaded. */
  canReload: boolean
  onReload: () => void
  onOpenDetail: () => void
  /** Closed without leaving: the editor stays, only reading. */
  onClose: () => void
  children: ReactNode
}

/**
 * The content changed while the editor was away and its hold expired (design
 * 24i): it sent nothing, so as not to overwrite the newer version, and offers
 * what it can rescue. *Načíst aktuální verzi* while nobody holds it, *Otevřít
 * detail* while someone does or it is no longer an editable draft.
 *
 * @param props.canReload - Whether the current version can be edited here.
 * @param props.children - The title („Článek se mezitím změnil“), the
 *   editor's sentences — away, the last save, nothing sent, what to rescue —
 *   then `ContentChangedDialogActions`.
 */
export const ContentChangedDialog = ({
  canReload,
  onReload,
  onOpenDetail,
  onClose,
  children,
}: Props) => {
  // The native close comes after the click, maybe after a re-render.
  const isLeavingRef = useRef(false)
  const ref = useModalDialog(() => {
    if (!isLeavingRef.current) onClose()
  })

  const leave = () => {
    isLeavingRef.current = true
    ref.current?.close()
    if (canReload) {
      onReload()
    } else {
      onOpenDetail()
    }
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <Context.Provider value={{ canReload, leave }}>
          {children}
        </Context.Provider>
      </AdminModalContent>
    </AdminDialog>
  )
}

/**
 * What the dialog shares with its actions: whether the current version loads
 * here, and leaving for it or for the detail.
 *
 * @returns The content changed dialog's context
 */
export const useContentChangedDialog = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error(
      'useContentChangedDialog must be used within a ContentChangedDialog',
    )
  }

  return context
}
