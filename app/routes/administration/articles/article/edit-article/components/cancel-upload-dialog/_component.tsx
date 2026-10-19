import { useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { DialogBody } from '~/components/dialog-body'
import { useModalDialog } from '~/utils/use-modal-dialog'

import { formatFailedUploadsSentence } from '../../utils/format-failed-uploads-sentence'
import { formatUploadingImagesSentence } from '../../utils/format-uploading-images-sentence'

type Props = {
  /** Images uploading now, new and replacements alike. */
  uploadingCount: number
  /** Replacements among them: their originals stay with the article. */
  replacingCount: number
  /** Uploads that failed since the dialog opened. */
  failedCount: number
  /** *Zrušit nahrávání a zavřít*, or *Zavřít editor* once all ran. */
  onLeave: () => void
  /** Closed any way but the leave button. */
  onStay: () => void
}

/**
 * Asks before *Zavřít* or a link out of the editor cancels the uploads under
 * way (design 24b, bxy8xxqs, moo05ljj; copy fmsjg9oc). It counts again as
 * uploads end: while some run, it says how many and that closing cancels
 * them; once none runs, it says whether all went or some failed, and its
 * button only closes, no longer in the danger colour.
 */
export const CancelUploadDialog = ({
  uploadingCount,
  replacingCount,
  failedCount,
  onLeave,
  onStay,
}: Props) => {
  // The native close comes after the leave, maybe after a re-render.
  const isLeavingRef = useRef(false)
  const ref = useModalDialog(() => {
    if (!isLeavingRef.current) onStay()
  })
  const isUploading = uploadingCount > 0

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>
          {isUploading ? 'Zrušit nahrávání a zavřít editor?' : 'Zavřít editor?'}
        </AdminModalTitle>
        <DialogBody>
          <AdminModalDescription>
            {isUploading
              ? formatUploadingImagesSentence(uploadingCount)
              : failedCount > 0
                ? formatFailedUploadsSentence(failedCount)
                : 'Nahrávání je dokončeno.'}
          </AdminModalDescription>
          {/* Only for replacements still running (fmsjg9oc). */}
          {isUploading && replacingCount > 0 && (
            <AdminModalDescription>
              {replacingCount === 1
                ? 'Původní obrázek zůstane u článku.'
                : 'Původní obrázky zůstanou u článku.'}
            </AdminModalDescription>
          )}
        </DialogBody>

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
