// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { href, useNavigation } from 'react-router'
import { AdminButton } from '~/components/admin-button'
import { AdminButtonLink } from '~/components/admin-button-link'
import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { Input } from '~/components/input'
import { Select } from '~/components/select'
import { slugify } from '~/utils/slugify'
import { useAutoSlug } from '~/utils/use-auto-slug'
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
  const { categoryId } = params
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: loaderData.category.authorId,
      name: loaderData.category.name,
      slug: loaderData.category.slug,
      state: loaderData.category.state,
    },
    id: 'edit-category',
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith('csrf')
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const { handleBlur } = useAutoSlug({
    fieldName: fields.slug.name,
    sourceValue: undefined,
    updateFieldValue: form.update,
  })

  const regenerateSlug = () => {
    form.update({
      name: fields.slug.name,
      value: slugify(fields.name.value || ''),
    })
  }

  const isLoadingOrSubmitting = state !== 'idle'
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Upravit kategorii</AdminHeadline>

      <Form method={'post'} {...getFormProps(form)}>
        <AuthenticityTokenInput />

        <Fieldset legend={'Základní informace'}>
          <Input
            errors={fields.name.errors}
            label={'Název'}
            {...getInputProps(fields.name, { type: 'text' })}
          />

          <AdminButtonLink
            disabled={isLoadingOrSubmitting}
            onClick={regenerateSlug}
            type={'button'}
          >
            Vygenerovat nový slug
          </AdminButtonLink>
          <Input
            errors={fields.slug.errors}
            label={'Slug'}
            onBlur={handleBlur}
            {...getInputProps(fields.slug, { type: 'text' })}
          />

          <Select
            errors={fields.authorId.errors}
            label={'Autor'}
            {...getSelectProps(fields.authorId)}
          >
            {loaderData.authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </Select>
        </Fieldset>

        <input {...getInputProps(fields.state, { type: 'hidden' })} />

        <FormActions>
          <AdminButton disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Ukládá se...' : 'Uložit'}
          </AdminButton>
          <AdminLinkButton
            disabled={isLoadingOrSubmitting}
            to={href('/administration/articles/categories/:categoryId', {
              categoryId,
            })}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
