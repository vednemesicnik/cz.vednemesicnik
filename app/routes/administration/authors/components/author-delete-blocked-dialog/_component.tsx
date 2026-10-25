import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { DialogBody } from '~/components/dialog-body'
import { LinkButton } from '~/components/link-button'
import { formatAuthorContentCounts } from '~/utils/author-references/format-author-content-counts'
import type { AuthorDeleteBlock } from '~/utils/author-references/get-author-delete-block'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  name: string
  /** What holds the author, from the loader's `getAuthorDeleteBlock`. */
  block: AuthorDeleteBlock
  /**
   * The author detail's Obsah section, from a list. Opened on the detail
   * itself there is none: the content is on the page (dksfb82t).
   */
  contentHref?: string
  onClose: () => void
}

/**
 * Why an author cannot be deleted, in place of the confirmation (design 28g,
 * copy 9w0473vu, zq7c99v0, 2zn4atua). The sentences follow what holds the author, so they come
 * from one `block` rather than from the caller. The counts are text; the way
 * on is *Zobrazit obsah*, only when content holds the author: approvals and
 * content history can't be changed, so for them there is only *Zavřít*
 * (fzqkfmeg, ol7vu3mn). Opens as it mounts.
 */
export const AuthorDeleteBlockedDialog = ({
  name,
  block,
  contentHref,
  onClose,
}: Props) => {
  const ref = useModalDialog(onClose)
  const contentCounts = formatAuthorContentCounts(block.contentCounts)
  // Approvals and content history get one sentence, whichever holds (28g).
  const hasRecords = block.hasApprovals || block.hasHistory

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{`Autor ${name} nejde smazat`}</AdminModalTitle>
        <DialogBody>
          {contentCounts !== '' && (
            <AdminModalDescription>
              {`Autor je uveden u ${contentCounts}. Smazat ho lze, pokud není uveden u žádného obsahu, schválení ani v historii obsahu.`}
            </AdminModalDescription>
          )}
          {/* Only approvals or history hold it: neither can be changed or removed (fzqkfmeg, ol7vu3mn). */}
          {contentCounts === '' && hasRecords && (
            <AdminModalDescription>
              Autor je uveden u schválení nebo v historii obsahu. Záznamy
              schválení a historie nelze v administraci upravit ani odebrat.
            </AdminModalDescription>
          )}
          {/* An account that can be deleted first, or one that never can (copy zq7c99v0). */}
          {block.account === 'deletable' && (
            <AdminModalDescription>
              {contentCounts === '' && !hasRecords
                ? 'Před smazáním autora je nutné smazat jeho účet.'
                : 'Před smazáním autora je nutné smazat také jeho účet.'}
            </AdminModalDescription>
          )}
          {block.account === 'owner' && (
            <AdminModalDescription>
              Autor je propojen s účtem Vlastníka, který nelze smazat.
            </AdminModalDescription>
          )}
          {block.account === 'own' && (
            <AdminModalDescription>
              Autor je propojen s vaším účtem. Vlastní účet nelze smazat.
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
          {contentHref !== undefined && contentCounts !== '' && (
            <LinkButton size={'sm'} to={contentHref} variant={'outline'}>
              Zobrazit obsah
            </LinkButton>
          )}
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
