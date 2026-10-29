import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalSubject } from '~/components/admin/admin-modal-subject'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { DialogBody } from '~/components/dialog-body'
import { StateChangeDialog } from '~/components/state-change-dialog'
import { FORM_CONFIG } from '~/config/form-config'

/** A state change that takes the article off the web (design 23e). */
export type ArticleStateDialogKind = 'retract' | 'archive'

type Props = {
  kind: ArticleStateDialogKind
  action: string
  fetcherKey: string
  articleTitle: string
  isApprover: boolean
  onClose: () => void
}

const COPY = {
  archive: {
    confirmLabel: 'Archivovat článek',
    description:
      'Čtenáři článek na webu neuvidí. V administraci zůstane mezi archivovanými.',
    intent: FORM_CONFIG.intent.value.archive,
    title: 'Archivovat článek?',
  },
  retract: {
    confirmLabel: 'Stáhnout z publikace',
    description: 'Článek se vrátí do konceptu. Čtenáři ho na webu neuvidí.',
    intent: FORM_CONFIG.intent.value.retract,
    title: 'Stáhnout z publikace?',
  },
} as const

/**
 * Confirms *Stáhnout z publikace…* or *Archivovat…* of one article (design
 * 23e, archive worded as the bulk one in 22c): the article by its title, what
 * readers lose, and for a retract by someone who can't publish, who can.
 *
 * @param props.kind - Retract or archive.
 * @param props.isApprover - Whether the person publishes; otherwise a retract
 *   says the Coordinator can publish the article again.
 */
export const ArticleStateDialog = ({
  kind,
  action,
  fetcherKey,
  articleTitle,
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
      <AdminModalSubject>{articleTitle}</AdminModalSubject>
      <DialogBody>
        <AdminModalDescription>{copy.description}</AdminModalDescription>
        {kind === 'retract' && !isApprover && (
          <AdminModalDescription>
            Znovu ho publikovat může Koordinátor.
          </AdminModalDescription>
        )}
      </DialogBody>
    </StateChangeDialog>
  )
}
