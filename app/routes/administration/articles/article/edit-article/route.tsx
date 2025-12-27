// noinspection JSUnusedGlobalSymbols

import {
  FormProvider,
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
import { AdminTextEditor } from '~/components/admin-text-editor'
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
  const { article } = loaderData
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: article.authorId,
      categoryIds: article.categoryIds,
      content: article.content,
      slug: article.slug,
      state: article.state,
      tagIds: article.tagIds,
      title: article.title,
    },
    id: 'edit-article',
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
      value: slugify(fields.title.value || ''),
    })
  }

  const isLoadingOrSubmitting = state !== 'idle'
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Upravit článek</AdminHeadline>

      <FormProvider context={form.context}>
        <Form
          encType={'multipart/form-data'}
          method={'post'}
          {...getFormProps(form)}
        >
          <AuthenticityTokenInput />

          <Fieldset
            disabled={isLoadingOrSubmitting}
            legend={'Základní informace'}
          >
            <Input
              {...getInputProps(fields.title, { type: 'text' })}
              errors={fields.title.errors}
              label={'Název'}
              placeholder={'Název článku'}
            />
            <AdminButtonLink
              disabled={isLoadingOrSubmitting}
              onClick={regenerateSlug}
              type="button"
            >
              Vygenerovat nový slug
            </AdminButtonLink>
            <Input
              {...getInputProps(fields.slug, { type: 'text' })}
              errors={fields.slug.errors}
              label={'Slug'}
              onBlur={handleBlur}
              placeholder={'nazev-clanku'}
            />
          </Fieldset>

          <Fieldset disabled={isLoadingOrSubmitting} legend={'Obsah'}>
            <AdminTextEditor
              {...getInputProps(fields.content, { type: 'text' })}
              defaultValue={fields.content.defaultValue}
              disabled={isLoadingOrSubmitting}
              errors={fields.content.errors}
              formMeta={{
                dirty: form.dirty,
                update: form.update,
                validate: form.validate,
              }}
              label={'Obsah článku'}
              placeholder={'Obsah článku...'}
            />
          </Fieldset>

          <Fieldset disabled={isLoadingOrSubmitting} legend={'Kategorizace'}>
            <Select
              {...getSelectProps(fields.categoryIds)}
              errors={fields.categoryIds.errors}
              label={'Kategorie (můžete vybrat více)'}
              multiple
            >
              {loaderData.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select
              {...getSelectProps(fields.tagIds)}
              errors={fields.tagIds.errors}
              label={'Tagy (můžete vybrat více)'}
              multiple
            >
              {loaderData.tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </Select>
          </Fieldset>

          <Fieldset
            disabled={isLoadingOrSubmitting}
            legend={'Informace o autorovi'}
          >
            <Select
              {...getSelectProps(fields.authorId)}
              errors={fields.authorId.errors}
              label={'Autor'}
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
              to={href('/administration/articles/:articleId', {
                articleId: params.articleId,
              })}
            >
              Zrušit
            </AdminLinkButton>
          </FormActions>
        </Form>
      </FormProvider>
    </AdminPage>
  )
}
