import { useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { useModalDialog } from '~/utils/use-modal-dialog'

import { CopyArticleTextButton } from '../copy-article-text-button'
import { CopyArticleTextHint } from '../copy-article-text-hint'
import styles from './_styles.module.css'

type Props = {
  holderName: string
  /** `formatHoldTakenDescription`: saved or not, the last save, read-only. */
  description: string
  hasUnsentChanges: boolean
  /** Reads the text editor's value, for *Zkopírovat celý text*. */
  getContent: () => string
  onOpenDetail: () => void
  /** *Zůstat a číst*, or the dialog closed any other way. */
  onStay: () => void
}

/**
 * Tells the editor whose hold went elsewhere who has it now (design 24h):
 * one's own other tab too, with one's own name. Without it, typing would
 * stop working unexplained. With changes that did not make it, it offers the
 * whole text to copy before anything reloads the article.
 *
 * @param props.holderName - Who edits it now.
 * @param props.hasUnsentChanges - Something stayed unsent.
 */
export const HoldTakenDialog = ({
  holderName,
  description,
  hasUnsentChanges,
  getContent,
  onOpenDetail,
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
        <AdminModalTitle>Úpravu přebírá {holderName}</AdminModalTitle>
        <AdminModalDescription>{description}</AdminModalDescription>

        {hasUnsentChanges && (
          <>
            <div className={styles.copy}>
              <CopyArticleTextButton getContent={getContent} />
              <CopyArticleTextHint />
            </div>
            <AdminModalDescription>
              Před otevřením detailu si zkopírujte text článku.
            </AdminModalDescription>
          </>
        )}

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
              onOpenDetail()
            }}
            size={'sm'}
            type={'button'}
          >
            Otevřít detail
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
