import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalSubject } from '~/components/admin/admin-modal-subject'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { DialogBody } from '~/components/dialog-body'
import { StateChangeDialog } from '~/components/state-change-dialog'
import { FORM_CONFIG } from '~/config/form-config'

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
  const copy = COPY[kind]

  return (
    <StateChangeDialog
      action={action}
      confirmLabel={copy.confirmLabel}
      fetcherKey={fetcherKey}
      intent={copy.intent}
      onClose={onClose}
    >
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
    </StateChangeDialog>
  )
}
