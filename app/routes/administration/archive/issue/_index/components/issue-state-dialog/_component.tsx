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

import type { IssueStateAction } from '../../../../utils/issue-actions'
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

// The article's dialogs (23e, 23f) said of an issue. It picks no publish date:
// the archive is ordered by year and order.
const COPY = {
  'approve-and-publish': {
    confirmLabel: 'Schválit a publikovat',
    description: 'Číslo bude publikováno na webu.',
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
    description: 'Číslo bude publikováno na webu.',
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
 * @param props.note - What a publish skips, such as a draft nobody submitted.
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
  const fetcher = useFetcher({ key: fetcherKey })
  const ref = useModalDialog(onClose)
  const copy = COPY[kind]

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
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
