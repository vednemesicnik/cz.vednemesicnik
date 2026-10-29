import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalSubject } from '~/components/admin/admin-modal-subject'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { DialogBody } from '~/components/dialog-body'
import { StateChangeDialog } from '~/components/state-change-dialog'
import { FORM_CONFIG } from '~/config/form-config'

import type { IssueStateAction } from '../../utils/issue-actions'
import styles from './_styles.module.css'

type Props = {
  kind: IssueStateAction
  action: string
  fetcherKey: string
  issueTitle: string
  isApprover: boolean
  note: string | null
  onClose: () => void
}

const INTENT_VALUE = FORM_CONFIG.intent.value

// The article's dialogs (23e, 23f) said of an issue (copy 5k0gp8ve). It picks
// no publish date: the archive is ordered by year and order.
const COPY = {
  'approve-and-publish': {
    confirmLabel: 'Schválit a publikovat',
    description: 'Číslo bude publikováno v archivu na webu.',
    intent: INTENT_VALUE.publish,
    title: 'Schválit a publikovat?',
  },
  archive: {
    confirmLabel: 'Archivovat číslo',
    description:
      'Čtenáři číslo na webu neuvidí. V administraci zůstane mezi archivovanými.',
    intent: INTENT_VALUE.archive,
    title: 'Archivovat číslo?',
  },
  publish: {
    confirmLabel: 'Publikovat',
    description: 'Číslo bude publikováno v archivu na webu.',
    intent: INTENT_VALUE.publish,
    title: 'Publikovat?',
  },
  retract: {
    confirmLabel: 'Stáhnout z publikace',
    description: 'Číslo se vrátí do konceptu. Čtenáři ho na webu neuvidí.',
    intent: INTENT_VALUE.retract,
    title: 'Stáhnout z publikace?',
  },
} as const

/**
 * Confirms a state change of one issue that changes the web (design 07c, 26b):
 * the issue by its title, what readers get or lose, and for a retract by
 * someone who can't publish, who can.
 *
 * @param props.kind - Publish, approve and publish, retract or archive.
 * @param props.isApprover - Whether the person publishes; otherwise a retract
 *   says the Coordinator can publish the issue again.
 * @param props.note - What a publish skips, such as a draft not submitted.
 */
export const IssueStateDialog = ({
  kind,
  action,
  fetcherKey,
  issueTitle,
  isApprover,
  note,
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
      <AdminModalSubject>{issueTitle}</AdminModalSubject>
      <DialogBody>
        <AdminModalDescription>{copy.description}</AdminModalDescription>
        {kind === 'retract' && !isApprover && (
          <AdminModalDescription>
            Znovu ho publikovat může Koordinátor.
          </AdminModalDescription>
        )}
        {note !== null && <p className={styles.note}>{note}</p>}
      </DialogBody>
    </StateChangeDialog>
  )
}
