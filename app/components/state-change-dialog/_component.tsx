import type { ReactNode } from 'react'
import { useFetcher } from 'react-router'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { FORM_CONFIG } from '~/config/form-config'
import { useModalDialog } from '~/utils/use-modal-dialog'

type Props = {
  action: string
  fetcherKey: string
  intent: string
  confirmLabel: string
  onClose: () => void
  children: ReactNode
}

/**
 * Confirms a state change of one record — publish, retract, archive (designs
 * 23e, 25d, 26b, 27a, 27b). The caller composes the heading and the sentences
 * from the modal parts; the dialog submits the intent through the fetcher and
 * closes. Opens as it mounts.
 *
 * @param props.action - The route the intent posts to.
 * @param props.fetcherKey - The fetcher the caller reads the result from.
 * @param props.intent - The state change the confirmation submits.
 * @param props.children - The title, the record and what the change does.
 */
export const StateChangeDialog = ({
  action,
  fetcherKey,
  intent,
  confirmLabel,
  onClose,
  children,
}: Props) => {
  const fetcher = useFetcher({ key: fetcherKey })
  const ref = useModalDialog(onClose)

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        {children}

        <fetcher.Form
          action={action}
          method={'post'}
          onSubmit={() => ref.current?.close()}
        >
          <AuthenticityTokenInput />
          <input
            name={FORM_CONFIG.intent.name}
            type={'hidden'}
            value={intent}
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
              {confirmLabel}
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
