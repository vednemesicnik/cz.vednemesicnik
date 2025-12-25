// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  getTextareaProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { href, useNavigation } from 'react-router'
import { AdminButton } from '~/components/admin-button'
import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
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
  params,
}: Route.ComponentProps) {
  const { authorId } = params
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: loaderData.author.id,
      bio: loaderData.author.bio ?? '',
      name: loaderData.author.name,
      roleId: loaderData.author.role.id,
    },
    id: 'edit-author',
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
      <AdminHeadline>Upravit autora</AdminHeadline>

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

        {loaderData.roles.length > 0 ? (
          <Fieldset disabled={isLoadingOrSubmitting} legend={'Oprávnění'}>
            <Select
              label="Role"
              {...getSelectProps(fields.roleId)}
              errors={fields.roleId.errors}
            >
              {loaderData.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {getAuthorRoleLabel(role.name)}
                </option>
              ))}
            </Select>
          </Fieldset>
        ) : (
          <input {...getInputProps(fields.roleId, { type: 'hidden' })} />
        )}

        <input {...getInputProps(fields.authorId, { type: 'hidden' })} />
        <AuthenticityTokenInput />

        <FormActions>
          <AdminButton disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Ukládá se...' : 'Uložit'}
          </AdminButton>
          <AdminLinkButton
            disabled={isLoadingOrSubmitting}
            to={href('/administration/authors/:authorId', { authorId })}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
