import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef, useState } from 'react'
import { href, useFetcher } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { AdminInput } from '~/components/admin/admin-input'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { FORM_CONFIG } from '~/config/form-config'
import type { action as twoFactorAction } from '~/routes/administration/settings/two-factor/_action'
import { schema } from '~/routes/administration/settings/two-factor/_schema'

import { useModalDialog } from '../../utils/use-modal-dialog'
import { BackupCodesStep } from '../backup-codes-step'
import styles from './_styles.module.css'

type Props = {
  // „enable“ turns two-factor on (two steps); „new-codes“ replaces the backup
  // codes and opens straight on the codes step (design 29c).
  mode: 'enable' | 'new-codes'
  onClose: () => void
}

type Enrollment = {
  qrCodeDataUri: string
  secret: string
}

// The key is easier to copy by hand in groups of four (design 29c).
const groupSecret = (secret: string) => secret.match(/.{1,4}/g)?.join(' ') ?? ''

/**
 * Turns two-factor authentication on — the code from the authenticator app,
 * then the backup codes — or shows a new set of backup codes. The codes step
 * cannot be closed until the person ticks that they saved the codes.
 */
export const TwoFactorDialog = ({ mode, onClose }: Props) => {
  const ref = useModalDialog(onClose)
  const fetcher = useFetcher<typeof twoFactorAction>()
  const authenticityToken = useAuthenticityToken()

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Ask for the secret (or the new codes) once, when the dialog opens.
  const hasStartedRef = useRef(false)
  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    const formData = new FormData()
    formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    formData.append(
      FORM_CONFIG.intent.name,
      mode === 'enable'
        ? FORM_CONFIG.intent.value.startEnrollment
        : FORM_CONFIG.intent.value.regenerateBackupCodes,
    )

    void fetcher.submit(formData, {
      action: href('/administration/settings/two-factor'),
      method: 'POST',
    })
  }, [authenticityToken, fetcher, mode])

  const { data } = fetcher

  useEffect(() => {
    if (data === undefined || !('status' in data)) return

    // Also after an expired secret, with a new QR code and key in place.
    if (data.status === 'enrollment') {
      setEnrollment({ qrCodeDataUri: data.qrCodeDataUri, secret: data.secret })
    }

    if (data.status === 'codes') {
      setCodes(data.backupCodes)
    }
  }, [data])

  // The codes are shown once: Esc does not close the step before the person
  // confirms they saved them.
  useEffect(() => {
    const dialog = ref.current

    if (dialog === null) return

    const handleCancel = (event: Event) => {
      if (codes !== null && !isConfirmed) {
        event.preventDefault()
      }
    }

    dialog.addEventListener('cancel', handleCancel)

    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [codes, isConfirmed, ref])

  const lastResult =
    data !== undefined && 'submissionResult' in data
      ? data.submissionResult
      : undefined

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    id: 'two-factor-enrollment',
    lastResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit',
  })

  const isSubmitting = fetcher.state !== 'idle'
  const handleClose = () => ref.current?.close()

  if (codes !== null) {
    return (
      <AdminDialog ref={ref}>
        <AdminModalContent className={styles.content}>
          <BackupCodesStep
            codes={codes}
            isConfirmed={isConfirmed}
            isReplacement={mode === 'new-codes'}
            onConfirmedChange={setIsConfirmed}
            onDone={handleClose}
          />
        </AdminModalContent>
      </AdminDialog>
    )
  }

  return (
    <AdminDialog ref={ref}>
      <AdminModalContent className={styles.content}>
        <AdminModalTitle>
          {mode === 'enable'
            ? 'Zapnout dvoufázové ověření'
            : 'Nové záložní kódy'}
        </AdminModalTitle>

        {mode === 'enable' && (
          <>
            <AdminModalDescription>
              V ověřovací aplikaci naskenujte QR kód a zadejte šestimístný kód,
              který aplikace zobrazí.
            </AdminModalDescription>

            {enrollment !== null && (
              <>
                <img
                  alt={'QR kód pro ověřovací aplikaci'}
                  className={styles.qrCode}
                  height={176}
                  src={enrollment.qrCodeDataUri}
                  width={176}
                />
                <p className={styles.secret}>
                  Nejde QR kód naskenovat? Zadejte do aplikace tento klíč:{' '}
                  <code className={styles.secretValue}>
                    {groupSecret(enrollment.secret)}
                  </code>
                </p>
              </>
            )}

            <fetcher.Form
              action={href('/administration/settings/two-factor')}
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
                label={'Kód z aplikace'}
                {...getInputProps(fields.code, { type: 'text' })}
                autoComplete={'one-time-code'}
                disabled={isSubmitting || enrollment === null}
                errors={fields.code.errors}
                inputMode={'numeric'}
                placeholder={'123 456'}
              />

              <AdminModalActions>
                <AdminButton
                  onClick={handleClose}
                  type={'button'}
                  variant={'secondary'}
                >
                  Zrušit
                </AdminButton>
                <AdminButton
                  disabled={isSubmitting || enrollment === null}
                  type={'submit'}
                >
                  Zapnout
                </AdminButton>
              </AdminModalActions>
            </fetcher.Form>
          </>
        )}
      </AdminModalContent>
    </AdminDialog>
  )
}
