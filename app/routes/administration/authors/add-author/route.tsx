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
import { AdminTextarea } from '~/components/admin/admin-textarea'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
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
}: Route.ComponentProps) {
  const { state } = useNavigation()

  const { articleId } = loaderData

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    // The name typed in an article's author search (24j).
    defaultValue: { name: loaderData.name },
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
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage measure={'form'}>
      <PageTitle>Nový autor</PageTitle>

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
        {/* Back to that article's editor after saving (24j), replacing the
            author the search started from (ivyin4kr). */}
        {articleId !== null && (
          <input name={'article'} type={'hidden'} value={articleId} />
        )}
        {articleId !== null && loaderData.replacedAuthorId !== null && (
          <input
            name={'replace'}
            type={'hidden'}
            value={loaderData.replacedAuthorId}
          />
        )}

        <FormActions>
          <Button disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Přidává se...' : 'Přidat'}
          </Button>
          <LinkButton
            disabled={isLoadingOrSubmitting}
            to={
              articleId === null
                ? href('/administration/authors')
                : href('/administration/articles/:articleId/edit-article', {
                    articleId,
                  })
            }
            variant={'outline'}
          >
            Zrušit
          </LinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
