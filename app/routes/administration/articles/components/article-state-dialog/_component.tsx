import { useFetcher } from 'react-router'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalSubject } from '~/components/admin/admin-modal-subject'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { FORM_CONFIG } from '~/config/form-config'
import { useModalDialog } from '~/utils/use-modal-dialog'

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
  const fetcher = useFetcher({ key: fetcherKey })
  const ref = useModalDialog(onClose)
  const copy = COPY[kind]

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{copy.title}</AdminModalTitle>
        <AdminModalSubject>{articleTitle}</AdminModalSubject>
        <AdminModalDescription>
          {copy.description}
          {kind === 'retract' && !isApprover && (
            <> Znovu ho publikovat může Koordinátor.</>
          )}
        </AdminModalDescription>

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
