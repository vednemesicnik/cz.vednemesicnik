import { useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { useModalDialog } from '~/utils/use-modal-dialog'

import { CopyArticleTextButton } from '../copy-article-text-button'

type Props = {
  /** `formatArticleChangedDescription`: away, the last save, nothing sent. */
  description: string
  /** Free and still an editable draft: the current version can be loaded. */
  canReload: boolean
  /** Reads the text editor's value, for *Zkopírovat celý text*. */
  getContent: () => string
  onReload: () => void
  onOpenDetail: () => void
  /** Closed without leaving: the editor stays, only reading. */
  onClose: () => void
}

/**
 * The article changed while the editor was away and its hold expired (design
 * 24i): it sent nothing, so as not to overwrite the newer text, and offers the
 * whole text to copy. *Načíst aktuální verzi* while nobody holds it, *Otevřít
 * detail* while someone does or it is no longer an editable draft.
 *
 * @param props.canReload - Whether the current version can be edited here.
 */
export const ArticleChangedDialog = ({
  description,
  canReload,
  getContent,
  onReload,
  onOpenDetail,
  onClose,
}: Props) => {
  // The native close comes after the click, maybe after a re-render.
  const isLeavingRef = useRef(false)
  const ref = useModalDialog(() => {
    if (!isLeavingRef.current) onClose()
  })
  const advice = canReload
    ? 'Před načtením aktuální verze si zkopírujte text článku.'
    : 'Před otevřením detailu si zkopírujte text článku.'

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Článek se mezitím změnil</AdminModalTitle>
        <AdminModalDescription>
          {description} {advice}
        </AdminModalDescription>

        <AdminModalActions>
          <CopyArticleTextButton getContent={getContent} variant={'ghost'} />
          <Button
            onClick={() => {
              isLeavingRef.current = true
              ref.current?.close()
              if (canReload) {
                onReload()
              } else {
                onOpenDetail()
              }
            }}
            size={'sm'}
            type={'button'}
          >
            {canReload ? 'Načíst aktuální verzi' : 'Otevřít detail'}
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
