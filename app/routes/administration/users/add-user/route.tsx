// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useState } from 'react'
import { href, useNavigation } from 'react-router'
import { AdminButton } from '~/components/admin-button'
import { AdminHeadline } from '~/components/admin-headline'
import { AdminInput } from '~/components/admin-input'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AdminRadioInput } from '~/components/admin-radio-input'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { Select } from '~/components/select'
import { schema } from './_schema'
import type { Route } from './+types/route'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { state } = useNavigation()
  const [authorMode, setAuthorMode] = useState<'new' | 'existing'>('new')

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorMode: 'new',
    },
    id: 'add-user',
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith('csrf')
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const isLoadingOrSubmitting = state !== 'idle'
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Přidat uživatele</AdminHeadline>

      <Form method="post" {...getFormProps(form)}>
        <Fieldset disabled={isLoadingOrSubmitting} legend={'Detaily uživatele'}>
          <AdminInput
            label="E-mail"
            {...getInputProps(fields.email, { type: 'email' })}
            errors={fields.email.errors}
            placeholder="user@domain.name"
          />
          <AdminInput
            label="Jméno a příjmení"
            {...getInputProps(fields.name, { type: 'text' })}
            errors={fields.name.errors}
            placeholder="Jan Novák"
          />
        </Fieldset>

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Heslo'}>
          <AdminInput
            label="Heslo"
            {...getInputProps(fields.password, { type: 'password' })}
            errors={fields.password.errors}
          />
          <AdminInput
            label="Potvrzení hesla"
            {...getInputProps(fields.passwordConfirmation, {
              type: 'password',
            })}
            errors={fields.passwordConfirmation.errors}
          />
        </Fieldset>

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Profil autora'}>
          <AdminRadioInput
            field={fields.authorMode}
            inputProps={{
              onChange: (event) =>
                setAuthorMode(event.currentTarget.value as 'new' | 'existing'),
              value: 'new',
            }}
            label={'Vytvořit nový profil autora'}
          />
          <AdminRadioInput
            field={fields.authorMode}
            inputProps={{
              onChange: (event) =>
                setAuthorMode(event.currentTarget.value as 'new' | 'existing'),
              value: 'existing',
            }}
            label={'Připojit k existujícímu autorovi'}
          />

          {authorMode === 'existing' && (
            <Select
              label="Vyberte autora"
              {...getSelectProps(fields.existingAuthorId)}
              errors={fields.existingAuthorId.errors}
            >
              <option value="">Vyberte autora</option>
              {loaderData.authorsWithoutUser.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name} ({author.role.name})
                </option>
              ))}
            </Select>
          )}
        </Fieldset>

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Oprávnění'}>
          <Select
            label="Role"
            {...getSelectProps(fields.roleId)}
            errors={fields.roleId.errors}
          >
            <option value="">Vyberte roli</option>
            {loaderData.roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <AdminButton disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Přidává se...' : 'Přidat'}
          </AdminButton>
          <AdminLinkButton
            disabled={isLoadingOrSubmitting}
            to={href('/administration/users')}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
