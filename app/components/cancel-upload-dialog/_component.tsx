import { type ReactNode, useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { DialogBody } from '~/components/dialog-body'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  /** Whether something still uploads: then leaving cancels it. */
  isUploading: boolean
  /** *Zrušit nahrávání a zavřít*, or *Zavřít editor* once all ran. */
  onLeave: () => void
  /** Closed any way but the leave button. */
  onStay: () => void
  /** What uploads, what stays, or how it ended, as `AdminModalDescription`s. */
  children: ReactNode
}

/**
 * Asks before *Zavřít* or a link out of an editor cancels the uploads under
 * way (design 24b, 26c, bxy8xxqs, moo05ljj; copy fmsjg9oc). The editor says
 * what it uploads and recounts as uploads end; once none runs, the button only
 * closes, no longer in the danger colour.
 */
export const CancelUploadDialog = ({
  isUploading,
  onLeave,
  onStay,
  children,
}: Props) => {
  // The native close comes after the leave, maybe after a re-render.
  const isLeavingRef = useRef(false)
  const ref = useModalDialog(() => {
    if (!isLeavingRef.current) onStay()
  })

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>
          {isUploading ? 'Zrušit nahrávání a zavřít editor?' : 'Zavřít editor?'}
        </AdminModalTitle>
        <DialogBody>{children}</DialogBody>

        <AdminModalActions>
          <Button
            onClick={() => ref.current?.close()}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zůstat v editoru
          </Button>
          <Button
            onClick={() => {
              isLeavingRef.current = true
              ref.current?.close()
              onLeave()
            }}
            size={'sm'}
            type={'button'}
            variant={isUploading ? 'danger' : 'primary'}
          >
            {isUploading ? 'Zrušit nahrávání a zavřít' : 'Zavřít editor'}
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
