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
import { AdminPage } from '~/components/admin/admin-page'
import { AdminRadioInput } from '~/components/admin/admin-radio-input'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { Select } from '~/components/select'
import { TextField } from '~/components/text-field'
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
      <PageTitle>Nový uživatel</PageTitle>

      <Form errors={form.errors} method="post" {...getFormProps(form)}>
        <Fieldset disabled={isLoadingOrSubmitting} legend={'Detaily uživatele'}>
          <TextField
            label="E-mail"
            {...getInputProps(fields.email, { type: 'email' })}
            errors={fields.email.errors}
            placeholder="jakub.novak@vednemesicnik.cz"
          />
          <TextField
            label="Jméno a příjmení"
            {...getInputProps(fields.name, { type: 'text' })}
            errors={fields.name.errors}
            placeholder="Jan Novák"
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
          {/* Creates the account and sends the invitation (design 28f). */}
          <Button disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Čekejte prosím…' : 'Vytvořit a pozvat'}
          </Button>
          <LinkButton
            disabled={isLoadingOrSubmitting}
            to={href('/administration/users')}
            variant={'outline'}
          >
            Zrušit
          </LinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
