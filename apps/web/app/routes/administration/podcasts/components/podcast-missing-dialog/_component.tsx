import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { DialogBody } from '~/components/dialog-body'
import { MissingContentDialog } from '~/components/missing-content-dialog'
import { FORM_CONFIG } from '~/config/form-config'
import type { MissingList } from '~/hooks/use-content-action-result'

type Props = {
  missingList: MissingList
  editHref: string
  onClose: () => void
}

/**
 * What blocks submitting, approving or publishing the podcast (design 27i),
 * one sentence per reason: what is missing, then the taken address. Opens as
 * it mounts.
 */
export const PodcastMissingDialog = ({
  missingList,
  editHref,
  onClose,
}: Props) => (
  <MissingContentDialog editHref={editHref} onClose={onClose}>
    <AdminModalTitle>
      {missingList.intent === FORM_CONFIG.intent.value.publish
        ? 'Podcast ještě nejde publikovat'
        : missingList.intent === FORM_CONFIG.intent.value.review
          ? 'Podcast ještě nejde schválit'
          : 'Podcast ještě nejde odeslat'}
    </AdminModalTitle>
    <DialogBody>
      {missingList.items.map((item) => (
        <AdminModalDescription key={item}>{item}</AdminModalDescription>
      ))}
    </DialogBody>
  </MissingContentDialog>
)
