import { type ReactNode, useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  holderName: string
  /** Saved or not, the last save, read-only; the editor's own sentence. */
  description: string
  /** What the editor offers to rescue when changes stayed unsent. */
  children?: ReactNode
  onOpenDetail: () => void
  /** *Zůstat a číst*, or the dialog closed any other way. */
  onStay: () => void
}

/**
 * Tells the editor whose hold went elsewhere who has it now (design 24h):
 * one's own other tab too, with one's own name. Without it, typing would
 * stop working unexplained. With changes that did not make it, the editor
 * offers what it can rescue before anything reloads the content.
 *
 * @param props.holderName - Who edits it now.
 */
export const HoldTakenDialog = ({
  holderName,
  description,
  children,
  onOpenDetail,
  onStay,
}: Props) => {
  // The native close comes after the click, maybe after a re-render.
  const isLeavingRef = useRef(false)
  const ref = useModalDialog(() => {
    if (!isLeavingRef.current) onStay()
  })

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Úpravu přebírá {holderName}</AdminModalTitle>
        <AdminModalDescription>{description}</AdminModalDescription>
        {children}

        <AdminModalActions>
          <Button
            onClick={() => ref.current?.close()}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zůstat a číst
          </Button>
          <Button
            onClick={() => {
              isLeavingRef.current = true
              ref.current?.close()
              onOpenDetail()
            }}
            size={'sm'}
            type={'button'}
          >
            Otevřít detail
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
