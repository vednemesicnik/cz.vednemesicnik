import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { BulletedList } from '~/components/bulleted-list'
import { Button } from '~/components/button'
import { LinkButton } from '~/components/link-button'
import { ListItem } from '~/components/list-item'
import { FORM_CONFIG } from '~/config/form-config'
import type { MissingList } from '~/hooks/use-content-action-result'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  missingList: MissingList
  editHref: string
  onClose: () => void
}

/**
 * What is missing before the article can be submitted or published (design
 * 23h), with the way to the editor. Opens as it mounts.
 */
export const ArticleMissingDialog = ({
  missingList,
  editHref,
  onClose,
}: Props) => {
  const ref = useModalDialog(onClose)

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
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
        <AdminModalActions>
          <Button
            onClick={() => ref.current?.close()}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zavřít
          </Button>
          <LinkButton size={'sm'} to={editHref}>
            Doplnit v editoru
          </LinkButton>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
