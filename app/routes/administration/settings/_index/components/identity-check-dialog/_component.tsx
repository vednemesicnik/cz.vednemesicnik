import { Form, href, useNavigation } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'

import { useModalDialog } from '../../utils/use-modal-dialog'

type Props = {
  // Where sign-in returns: the settings page with the dialog to reopen.
  redirectTo: string
  onClose: () => void
}

/**
 * The identity check before a change of a sign-in method, today's variant of
 * design 29d: it signs out and sends the person to sign in again, which
 * returns them here (verify-identity's action does both).
 */
export const IdentityCheckDialog = ({ redirectTo, onClose }: Props) => {
  const ref = useModalDialog(onClose)
  const { state } = useNavigation()
  const isSubmitting = state !== 'idle'

  const handleCancel = () => ref.current?.close()

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>Ověřte, že jste to vy</AdminModalTitle>
        <AdminModalDescription>
          Před změnou způsobu přihlášení se přihlaste znovu. Pokračováním se
          nejprve odhlásíte.
        </AdminModalDescription>

        <Form
          action={href('/administration/settings/verify-identity')}
          method={'post'}
        >
          <input name={'redirectTo'} type={'hidden'} value={redirectTo} />
          <AuthenticityTokenInput />

          <AdminModalActions>
            <AdminButton
              disabled={isSubmitting}
              onClick={handleCancel}
              type={'button'}
              variant={'secondary'}
            >
              Zrušit
            </AdminButton>
            <AdminButton disabled={isSubmitting} type={'submit'}>
              Odhlásit a přihlásit znovu
            </AdminButton>
          </AdminModalActions>
        </Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
