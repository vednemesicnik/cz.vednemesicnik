import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { BulletedList } from '~/components/bulleted-list'
import { ListItem } from '~/components/list-item'
import { MissingContentDialog } from '~/components/missing-content-dialog'
import { FORM_CONFIG } from '~/config/form-config'
import type { MissingList } from '~/hooks/use-content-action-result'

type Props = {
  missingList: MissingList
  editHref: string
  onClose: () => void
}

/**
 * What is missing before the article can be submitted or published (design
 * 23h), one item per line. Opens as it mounts.
 */
export const ArticleMissingDialog = ({
  missingList,
  editHref,
  onClose,
}: Props) => (
  <MissingContentDialog editHref={editHref} onClose={onClose}>
    <AdminModalTitle>
      {missingList.intent === FORM_CONFIG.intent.value.publish
        ? 'Článek ještě nejde publikovat'
        : 'Článek ještě nejde odeslat'}
    </AdminModalTitle>
    <BulletedList>
      {missingList.items.map((item) => (
        <ListItem key={item}>{item}</ListItem>
      ))}
    </BulletedList>
  </MissingContentDialog>
)
