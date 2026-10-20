import type { ReactNode } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { Button } from '~/components/button'
import { LinkButton } from '~/components/link-button'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  /** The editor, where the missing parts are filled in. */
  editHref: string
  onClose: () => void
  /** The `AdminModalTitle` and what is missing. */
  children: ReactNode
}

/**
 * What is missing before content can be submitted or published, with the way
 * to the editor (design 23h, 26e). The content says what it lacks in its own
 * words: the article as a list, the issue in one sentence. Opens as it mounts.
 */
export const MissingContentDialog = ({
  editHref,
  onClose,
  children,
}: Props) => {
  const ref = useModalDialog(onClose)

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        {children}
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
