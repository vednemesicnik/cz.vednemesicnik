import { type ReactNode, useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  /** „Článek se mezitím změnil“, „Číslo se mezitím změnilo“. */
  title: string
  /** Away, the last save, nothing sent; the editor's own sentence. */
  description: string
  /** What the editor offers to rescue, under the description. */
  children?: ReactNode
  /** An action before the main one, such as *Zkopírovat celý text*. */
  rescueAction?: ReactNode
  /** Free and still an editable draft: the current version can be loaded. */
  canReload: boolean
  onReload: () => void
  onOpenDetail: () => void
  /** Closed without leaving: the editor stays, only reading. */
  onClose: () => void
}

/**
 * The content changed while the editor was away and its hold expired (design
 * 24i): it sent nothing, so as not to overwrite the newer version, and offers
 * what it can rescue. *Načíst aktuální verzi* while nobody holds it, *Otevřít
 * detail* while someone does or it is no longer an editable draft.
 *
 * @param props.canReload - Whether the current version can be edited here.
 */
export const ContentChangedDialog = ({
  title,
  description,
  children,
  rescueAction,
  canReload,
  onReload,
  onOpenDetail,
  onClose,
}: Props) => {
  // The native close comes after the click, maybe after a re-render.
  const isLeavingRef = useRef(false)
  const ref = useModalDialog(() => {
    if (!isLeavingRef.current) onClose()
  })

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{title}</AdminModalTitle>
        <AdminModalDescription>{description}</AdminModalDescription>
        {children}

        <AdminModalActions>
          {rescueAction}
          <Button
            onClick={() => {
              isLeavingRef.current = true
              ref.current?.close()
              if (canReload) {
                onReload()
              } else {
                onOpenDetail()
              }
            }}
            size={'sm'}
            type={'button'}
          >
            {canReload ? 'Načíst aktuální verzi' : 'Otevřít detail'}
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
