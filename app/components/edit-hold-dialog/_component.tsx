import { useRef } from 'react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import type { EditHoldContent } from '~/utils/edit-hold/edit-hold-content'
import { useModalDialog } from '~/utils/use-modal-dialog'

/** Whose hold the editor met: someone else's, or one's own in another tab (24g). */
export type EditHoldDialogKind = 'take-over' | 'other-tab'

// The other tab's title per content (24g; copy ey73zhul for the issue).
const OTHER_TAB_TITLE: Record<EditHoldContent, string> = {
  article: 'Článek máte otevřený v jiné záložce',
  issue: 'Číslo máte otevřené v jiné záložce',
}

type Props = {
  content: EditHoldContent
  kind: EditHoldDialogKind
  /** The takeover's who, since and last save; the other tab's text is fixed. */
  description?: string
  onConfirm: () => void
  /** Leaves the editor (*Zavřít* goes to the detail, 24g). */
  onCancel: () => void
}

const COPY = {
  'other-tab': {
    cancelLabel: 'Zavřít',
    confirmLabel: 'Upravovat tady',
    description:
      'Pokračováním tady se druhá záložka přepne do čtení. Její neuložené změny se mohou ztratit.',
  },
  'take-over': {
    cancelLabel: 'Zrušit',
    confirmLabel: 'Převzít úpravu',
    description: '',
    title: 'Převzít úpravu?',
  },
} as const

/**
 * Asks before the editor takes held content (design 24g): the Coordinator
 * taking someone else's edit, or anyone moving their own edit to this tab.
 * *Převzít úpravu* stays primary: nothing saved is lost. Closing it any other
 * way leaves the editor.
 *
 * @param props.content - What the editor edits.
 * @param props.kind - Someone else's hold, or one's own in another tab.
 * @param props.description - The takeover's text (`formatTakeOverDescription`).
 */
export const EditHoldDialog = ({
  content,
  kind,
  description,
  onConfirm,
  onCancel,
}: Props) => {
  // The native close comes after the confirm, maybe after a re-render.
  const isConfirmedRef = useRef(false)
  const ref = useModalDialog(() => {
    if (!isConfirmedRef.current) onCancel()
  })
  const copy = COPY[kind]

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>
          {kind === 'other-tab'
            ? OTHER_TAB_TITLE[content]
            : COPY['take-over'].title}
        </AdminModalTitle>
        <AdminModalDescription>
          {description ?? copy.description}
        </AdminModalDescription>

        <AdminModalActions>
          <Button
            onClick={() => ref.current?.close()}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            {copy.cancelLabel}
          </Button>
          <Button
            onClick={() => {
              isConfirmedRef.current = true
              ref.current?.close()
              onConfirm()
            }}
            size={'sm'}
            type={'button'}
          >
            {copy.confirmLabel}
          </Button>
        </AdminModalActions>
      </AdminModalContent>
    </AdminDialog>
  )
}
