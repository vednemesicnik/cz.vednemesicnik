import { useFetcher } from 'react-router'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalSubject } from '~/components/admin/admin-modal-subject'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { DialogBody } from '~/components/dialog-body'
import { FORM_CONFIG } from '~/config/form-config'
import { useModalDialog } from '~/utils/use-modal-dialog'

/** A state change that takes the episode off the web (design 27b). */
export type EpisodeStateDialogKind = 'retract' | 'archive'

type Props = {
  kind: EpisodeStateDialogKind
  action: string
  fetcherKey: string
  episodeTitle: string
  isApprover: boolean
  onClose: () => void
}

// Copy djni9qbc, as the article's (23e) and the bulk one's (22c, 27b).
const COPY = {
  archive: {
    confirmLabel: 'Archivovat epizodu',
    description:
      'Čtenáři epizodu na webu neuvidí. V administraci zůstane mezi archivovanými.',
    intent: FORM_CONFIG.intent.value.archive,
    title: 'Archivovat epizodu?',
  },
  retract: {
    confirmLabel: 'Stáhnout z publikace',
    description: 'Epizoda se vrátí do konceptu. Čtenáři ji na webu neuvidí.',
    intent: FORM_CONFIG.intent.value.retract,
    title: 'Stáhnout z publikace?',
  },
} as const

/**
 * Confirms *Stáhnout z publikace…* or *Archivovat…* of one episode (design
 * 27b, copy djni9qbc): the episode by its number and title, what readers
 * lose, and for a retract by someone who can't publish, who can. Opens as it
 * mounts.
 *
 * @param props.kind - Retract or archive.
 * @param props.isApprover - Whether the person publishes; otherwise a retract
 *   says the Coordinator can publish the episode again.
 */
export const EpisodeStateDialog = ({
  kind,
  action,
  fetcherKey,
  episodeTitle,
  isApprover,
  onClose,
}: Props) => {
  const fetcher = useFetcher({ key: fetcherKey })
  const ref = useModalDialog(onClose)
  const copy = COPY[kind]

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{copy.title}</AdminModalTitle>
        <AdminModalSubject>{episodeTitle}</AdminModalSubject>
        <DialogBody>
          <AdminModalDescription>{copy.description}</AdminModalDescription>
          {kind === 'retract' && !isApprover && (
            <AdminModalDescription>
              Znovu ji publikovat může Koordinátor.
            </AdminModalDescription>
          )}
        </DialogBody>

        <fetcher.Form
          action={action}
          method={'post'}
          onSubmit={() => ref.current?.close()}
        >
          <AuthenticityTokenInput />
          <input
            name={FORM_CONFIG.intent.name}
            type={'hidden'}
            value={copy.intent}
          />

          <AdminModalActions>
            <Button
              onClick={() => ref.current?.close()}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              Zrušit
            </Button>
            <Button size={'sm'} type={'submit'}>
              {copy.confirmLabel}
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
