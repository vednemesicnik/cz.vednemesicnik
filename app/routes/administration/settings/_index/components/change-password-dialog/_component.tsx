import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect } from 'react'
import { href, useFetcher } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { AdminInput } from '~/components/admin/admin-input'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import type { action as changePasswordAction } from '~/routes/administration/settings/change-password/_action'
import { schema } from '~/routes/administration/settings/change-password/_schema'

import { useModalDialog } from '../../utils/use-modal-dialog'
import styles from './_styles.module.css'

type Props = {
  hasPassword: boolean
  onSaved: () => void
  onClose: () => void
}

/**
 * Sets or changes the emergency sign-in password (design 29d). Without a
 * password yet it reads „Nastavit heslo“.
 */
export const ChangePasswordDialog = ({
  hasPassword,
  onSaved,
  onClose,
}: Props) => {
  const ref = useModalDialog(onClose)
  const fetcher = useFetcher<typeof changePasswordAction>()

  const lastResult =
    fetcher.data !== undefined && 'submissionResult' in fetcher.data
      ? fetcher.data.submissionResult
      : undefined

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    id: 'change-password',
    lastResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldRevalidate: 'onInput',
    shouldValidate: 'onBlur',
  })

  const isSaved =
    fetcher.data !== undefined &&
    'status' in fetcher.data &&
    fetcher.data.status === 'success'

  useEffect(() => {
    if (isSaved) {
      onSaved()
      ref.current?.close()
    }
  }, [isSaved, onSaved, ref])

  const isSubmitting = fetcher.state !== 'idle'
  const handleCancel = () => ref.current?.close()

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>
          {hasPassword ? 'Změnit heslo' : 'Nastavit heslo'}
        </AdminModalTitle>

        <fetcher.Form
          action={href('/administration/settings/change-password')}
          className={styles.form}
          method={'post'}
          {...getFormProps(form)}
        >
          <AuthenticityTokenInput />

          {form.errors !== undefined && form.errors.length > 0 && (
            <ErrorMessageGroup>
              {form.errors.map((error) => (
                <ErrorMessage key={error}>{error}</ErrorMessage>
              ))}
            </ErrorMessageGroup>
          )}

          <AdminInput
            label={'Nové heslo'}
            {...getInputProps(fields.newPassword, { type: 'password' })}
            autoComplete={'new-password'}
            disabled={isSubmitting}
            errors={fields.newPassword.errors}
          />
          <AdminInput
            label={'Nové heslo znovu'}
            {...getInputProps(fields.newPasswordConfirmation, {
              type: 'password',
            })}
            autoComplete={'new-password'}
            disabled={isSubmitting}
            errors={fields.newPasswordConfirmation.errors}
          />

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
              Uložit
            </AdminButton>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
