// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { href, useNavigation } from 'react-router'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminTextarea } from '~/components/admin/admin-textarea'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { LinkButton } from '~/components/link-button'
import { Select } from '~/components/select'
import { TextField } from '~/components/text-field'
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

      <Form errors={form.errors} method="post" {...getFormProps(form)}>
        <Fieldset disabled={isLoadingOrSubmitting} legend={'Detaily autora'}>
          <TextField
            label="Jméno"
            {...getInputProps(fields.name, { type: 'text' })}
            errors={fields.name.errors}
            placeholder="Jan Novák"
          />
          <AdminTextarea
            field={fields.bio}
            label="Bio"
            textareaProps={{
              placeholder: 'Krátký popis autora...',
              rows: 10,
            }}
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
          <Button disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Ukládá se...' : 'Uložit'}
          </Button>
          <LinkButton
            disabled={isLoadingOrSubmitting}
            to={href('/administration/authors/:authorId', { authorId })}
            variant={'outline'}
          >
            Zrušit
          </LinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
