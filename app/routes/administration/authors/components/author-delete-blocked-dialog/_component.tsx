import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { DialogBody } from '~/components/dialog-body'
import { formatAuthorContentCounts } from '~/utils/author-references/format-author-content-counts'
import type { AuthorDeleteBlock } from '~/utils/author-references/get-author-delete-block'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  name: string
  /** What holds the author, from the loader's `getAuthorDeleteBlock`. */
  block: AuthorDeleteBlock
  onClose: () => void
}

/**
 * Why an author cannot be deleted, in place of the confirmation (design 28g,
 * copy 9w0473vu). The sentences follow what holds the author, so they come
 * from one `block` rather than from the caller. The counts are text and the
 * only action is *Zavřít*: *Zobrazit obsah* waits for the author detail's
 * Obsah column (dksfb82t). Opens as it mounts.
 */
export const AuthorDeleteBlockedDialog = ({ name, block, onClose }: Props) => {
  const ref = useModalDialog(onClose)
  const contentCounts = formatAuthorContentCounts(block.contentCounts)

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{`Autor ${name} nejde smazat`}</AdminModalTitle>
        <DialogBody>
          {contentCounts !== '' && (
            <AdminModalDescription>
              {`Autor je uveden u ${contentCounts}. Smazat ho lze, až nebude uveden u žádného obsahu ani schválení.`}
            </AdminModalDescription>
          )}
          {/* Only approvals hold it: they cannot be changed or removed (fzqkfmeg). */}
          {contentCounts === '' && block.hasApprovals && (
            <AdminModalDescription>
              Autor je uveden u schválení obsahu. Toto schválení nelze v
              administraci změnit ani odebrat.
            </AdminModalDescription>
          )}
          {block.hasAccount && (
            <AdminModalDescription>
              Před smazáním autora je nutné smazat také jeho účet.
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
            Zavřít
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
