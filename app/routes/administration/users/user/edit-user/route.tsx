// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { href, useNavigation } from 'react-router'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { Link } from '~/components/link'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { Select } from '~/components/select'
import { TextField } from '~/components/text-field'
import { hasEmailChanged } from '~/utils/has-email-changed'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { formatEmailTakenMessage } from './utils/format-email-taken-message'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const { userId } = params
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      email: loaderData.user.email,
      roleId: loaderData.user.role.id,
      userId: loaderData.user.id,
    },
    id: 'edit-user',
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith('csrf')
    },
    shouldRevalidate: 'onBlur',
    // The domain and the @ show as the field is left; a taken address after
    // Save (design 28f).
    shouldValidate: 'onBlur',
  })

  const isLoadingOrSubmitting = state !== 'idle'
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid
  const isEmailChanged = hasEmailChanged(
    loaderData.user.email,
    fields.email.value,
  )

  // The taken-address error names the other account as a link (28e), only
  // while the field still shows it.
  const emailOwner = actionData?.emailOwner ?? null
  const emailErrors = fields.email.errors?.map((error) =>
    emailOwner !== null &&
    error === formatEmailTakenMessage(emailOwner.name) ? (
      <>
        Zadejte jiný e-mail — tuto adresu už používá účet:{' '}
        <Link
          to={href('/administration/users/:userId', {
            userId: emailOwner.userId,
          })}
        >
          {emailOwner.name}
        </Link>
        .
      </>
    ) : (
      error
    ),
  )

  return (
    <AdminPage measure={'form'}>
      <PageTitle>Upravit uživatele</PageTitle>

      <Form errors={form.errors} method="post" {...getFormProps(form)}>
        <Fieldset disabled={isLoadingOrSubmitting} legend={'Detaily uživatele'}>
          <TextField
            label={'E-mail'}
            {...getInputProps(fields.email, { type: 'email' })}
            errors={emailErrors}
            placeholder={'user@domain.name'}
          />
        </Fieldset>

        {loaderData.roles.length > 0 ? (
          <Fieldset disabled={isLoadingOrSubmitting} legend={'Oprávnění'}>
            <Select
              label={'Role'}
              {...getSelectProps(fields.roleId)}
              errors={fields.roleId.errors}
            >
              {loaderData.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </Fieldset>
        ) : (
          <input {...getInputProps(fields.roleId, { type: 'hidden' })} />
        )}

        <AdminParagraph>
          Jméno a autorskou roli upravíte v detailu autora:{' '}
          <Link
            to={href('/administration/authors/:authorId', {
              authorId: loaderData.user.author.id,
            })}
          >
            {loaderData.user.author.name}
          </Link>
          .
        </AdminParagraph>

        <input {...getInputProps(fields.userId, { type: 'hidden' })} />
        <AuthenticityTokenInput />

        {isEmailChanged && (
          <Callout tone={'warning'}>
            K přihlášení e-mailem bude sloužit nová adresa. Na původní adresu
            přijde oznámení o změně.
          </Callout>
        )}

        <FormActions>
          <Button disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Ukládá se...' : 'Uložit'}
          </Button>
          <LinkButton
            disabled={isLoadingOrSubmitting}
            to={href('/administration/users/:userId', { userId })}
            variant={'outline'}
          >
            Zrušit
          </LinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
