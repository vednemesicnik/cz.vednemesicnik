// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  getTextareaProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useNavigation } from 'react-router'

import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { Input } from '~/components/input'
import { Select } from '~/components/select'
import { TextArea } from '~/components/text-area'
import { getAuthorRoleLabel } from '~/utils/role-labels'
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

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    id: 'add-author',
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith('csrf')
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const isLoadingOrSubmitting = state !== 'idle'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Přidat autora</AdminHeadline>

      <Form method="post" {...getFormProps(form)}>
        <Fieldset disabled={isLoadingOrSubmitting} legend={'Detaily autora'}>
          <Input
            label="Jméno"
            {...getInputProps(fields.name, { type: 'text' })}
            errors={fields.name.errors}
            placeholder="Jan Novák"
          />
          <TextArea
            label="Bio"
            {...getTextareaProps(fields.bio)}
            errors={fields.bio.errors}
            placeholder="Krátký popis autora..."
          />
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
                {getAuthorRoleLabel(role.name)}
              </option>
            ))}
          </Select>
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <Button disabled={!canSubmit} type="submit" variant={'primary'}>
            Přidat
          </Button>
          <AdminLinkButton to={'/administration/authors'}>
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
