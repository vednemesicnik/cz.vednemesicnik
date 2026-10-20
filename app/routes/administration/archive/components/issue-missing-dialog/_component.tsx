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
 * What is missing before the issue can be submitted or published (design
 * 26e), in one sentence. Opens as it mounts.
 */
export const IssueMissingDialog = ({
  missingList,
  editHref,
  onClose,
}: Props) => (
  <MissingContentDialog editHref={editHref} onClose={onClose}>
    <AdminModalTitle>
      {missingList.intent === FORM_CONFIG.intent.value.publish
        ? 'Číslo ještě nejde publikovat'
        : 'Číslo ještě nejde odeslat'}
    </AdminModalTitle>
    <DialogBody>
      {missingList.items.map((item) => (
        <AdminModalDescription key={item}>{item}</AdminModalDescription>
      ))}
    </DialogBody>
  </MissingContentDialog>
)
