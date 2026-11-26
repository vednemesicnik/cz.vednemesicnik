import type { ReactNode } from 'react'
import { useFetcher } from 'react-router'

import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { useStateChangeDialog } from '~/components/state-change-dialog'
import { FORM_CONFIG } from '~/config/form-config'

type Props = {
  children: ReactNode
}

/**
 * The actions of a `StateChangeDialog`: Zrušit, then the confirmation, which
 * submits the dialog's intent through its fetcher and closes it.
 *
 * @param props.children - The confirmation's label, e.g. „Archivovat článek“.
 * @returns The form with the actions
 */
export const StateChangeDialogActions = ({ children }: Props) => {
  const { action, close, fetcherKey, intent } = useStateChangeDialog()
  const fetcher = useFetcher({ key: fetcherKey })

  return (
    <fetcher.Form action={action} method={'post'} onSubmit={close}>
      <AuthenticityTokenInput />
      <input name={FORM_CONFIG.intent.name} type={'hidden'} value={intent} />

      <AdminModalActions>
        <Button onClick={close} size={'sm'} type={'button'} variant={'ghost'}>
          Zrušit
        </Button>
        <Button size={'sm'} type={'submit'}>
          {children}
        </Button>
      </AdminModalActions>
    </fetcher.Form>
  )
}
