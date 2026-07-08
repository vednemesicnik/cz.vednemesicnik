// noinspection JSUnusedGlobalSymbols

import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { href, Form as RouterForm, useNavigation } from 'react-router'
import { AdminButton } from '~/components/admin/admin-button'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminInput } from '~/components/admin/admin-input'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { FORM_CONFIG } from '~/config/form-config'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { BackupCodesPanel } from './backup-codes-panel'

export { action } from './_action'
export { handle } from './_handle'
export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { state } = useNavigation()

  // The action returns either a validation result or a one-time set of backup
  // codes, so narrow before reading each.
  const submissionResult =
    actionData && 'submissionResult' in actionData
      ? actionData.submissionResult
      : undefined
  const backupCodes =
    actionData && 'backupCodes' in actionData
      ? actionData.backupCodes
      : undefined

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    id: 'two-factor-enrollment',
    lastResult: submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => !field.startsWith('csrf'),
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const isLoadingOrSubmitting = state !== 'idle'
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  if (loaderData.isEnrolled) {
    return (
      <AdminPage>
        <AdminHeadline>Dvoufázové ověření</AdminHeadline>

        <p>
          Dvoufázové ověření je aktivní. Při přihlášení heslem budete kromě
          hesla zadávat i jednorázový kód z autentikační aplikace.
        </p>

        {backupCodes !== undefined && <BackupCodesPanel codes={backupCodes} />}

        <p>
          Zbývající záložní kódy: {loaderData.unusedBackupCodesCount}
          {loaderData.unusedBackupCodesCount <= 2 &&
            ' — doporučujeme vygenerovat nové.'}
        </p>

        <RouterForm method="post">
          <AuthenticityTokenInput />
          <FormActions>
            <AdminButton
              disabled={isLoadingOrSubmitting}
              name={FORM_CONFIG.intent.name}
              type="submit"
              value={FORM_CONFIG.intent.value.regenerateBackupCodes}
              variant="secondary"
            >
              Regenerovat záložní kódy
            </AdminButton>
            <AdminButton
              disabled={isLoadingOrSubmitting}
              name={FORM_CONFIG.intent.name}
              type="submit"
              value={FORM_CONFIG.intent.value.delete}
              variant="danger"
            >
              Vypnout dvoufázové ověření
            </AdminButton>
            <AdminLinkButton
              disabled={isLoadingOrSubmitting}
              to={href('/administration/settings/profile')}
            >
              Zpět
            </AdminLinkButton>
          </FormActions>
        </RouterForm>
      </AdminPage>
    )
  }

  return (
    <AdminPage>
      <AdminHeadline>Dvoufázové ověření</AdminHeadline>

      <p>
        Naskenujte QR kód v autentikační aplikaci (např. Google Authenticator,
        1Password, Authy) a zadejte vygenerovaný šestimístný kód pro dokončení
        nastavení.
      </p>

      {loaderData.qrCodeDataUri !== null && (
        <img
          alt="QR kód pro autentikační aplikaci"
          height={200}
          src={loaderData.qrCodeDataUri}
          width={200}
        />
      )}

      <p>
        Pokud QR kód nelze naskenovat, zadejte tento klíč ručně:{' '}
        <code>{loaderData.secret}</code>
      </p>

      <Form {...getFormProps(form)} errors={form.errors} method="post">
        <Fieldset disabled={isLoadingOrSubmitting} legend="Ověřovací kód">
          <AdminInput
            label="Kód z aplikace"
            {...getInputProps(fields.code, { type: 'text' })}
            autoComplete="one-time-code"
            errors={fields.code.errors}
            inputMode="numeric"
            placeholder="123456"
          />
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <AdminButton disabled={!canSubmit} type="submit">
            {isSubmitting ? 'Ověřuji…' : 'Zapnout dvoufázové ověření'}
          </AdminButton>
          <AdminLinkButton
            disabled={isLoadingOrSubmitting}
            to={href('/administration/settings/profile')}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
