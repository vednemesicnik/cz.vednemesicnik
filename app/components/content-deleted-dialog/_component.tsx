import { type ReactNode, useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  /** „Článek byl smazán“, „Číslo bylo smazáno“. */
  title: string
  /** That it cannot be edited, and until when what it shows stays. */
  description: string
  /** What the editor offers to rescue, under the description. */
  children?: ReactNode
  onOpenList: () => void
  /** *Zůstat a číst*, or the dialog closed any other way. */
  onStay: () => void
}

/**
 * The content the editor had open was deleted (design 24k, 26m; log 0036):
 * after its hold expired, after a takeover, or as an empty draft. Who
 * deleted it is not said. The detail is gone too, so the way out is the list.
 *
 * @param props.title - What was deleted.
 */
export const ContentDeletedDialog = ({
  title,
  description,
  children,
  onOpenList,
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
        <AdminModalTitle>{title}</AdminModalTitle>
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
              onOpenList()
            }}
            size={'sm'}
            type={'button'}
          >
            Přejít na seznam
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
