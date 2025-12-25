// noinspection JSUnusedGlobalSymbols

import {
  FormProvider,
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
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AdminTextEditor } from '~/components/admin-text-editor'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { Input } from '~/components/input'
import { Select } from '~/components/select'
import { useSlug } from '~/utils/permissions/use-slug'
import { slugify } from '~/utils/slugify'
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
    defaultValue: {
      authorId: loaderData.selfAuthorId,
    },
    id: 'add-article',
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith('csrf')
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const [title, setTitle] = useState('')
  const { slug, setSlug, setIsSlugFocused } = useSlug(title)

  const isLoadingOrSubmitting = state !== 'idle'
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Přidat článek</AdminHeadline>

      <FormProvider context={form.context}>
        <Form method={'post'} {...getFormProps(form)}>
          <AuthenticityTokenInput />

          <Fieldset
            disabled={isLoadingOrSubmitting}
            legend={'Základní informace'}
          >
            <Input
              errors={fields.title.errors}
              label={'Název'}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={'Název článku'}
              {...getInputProps(fields.title, { type: 'text' })}
            />
            <Input
              errors={fields.slug.errors}
              label={'Slug'}
              onBlur={() => setSlug((value) => slugify(value))}
              onChange={(event) => setSlug(event.target.value)}
              onFocus={() => setIsSlugFocused(true)}
              placeholder={'nazev-clanku'}
              value={slug}
              {...getInputProps(fields.slug, { type: 'text' })}
            />
          </Fieldset>

          <Fieldset disabled={isLoadingOrSubmitting} legend={'Obsah'}>
            <AdminTextEditor
              disabled={isLoadingOrSubmitting}
              errors={fields.content.errors}
              label={'Obsah článku'}
              placeholder={'Začněte psát obsah článku...'}
              {...getInputProps(fields.content, { type: 'text' })}
            />
          </Fieldset>

          <Fieldset disabled={isLoadingOrSubmitting} legend={'Kategorizace'}>
            <Select
              errors={fields.categoryIds.errors}
              label={'Kategorie (můžete vybrat více)'}
              multiple
              {...getSelectProps(fields.categoryIds)}
            >
              {loaderData.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select
              errors={fields.tagIds.errors}
              label={'Tagy (můžete vybrat více)'}
              multiple
              {...getSelectProps(fields.tagIds)}
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

          <FormActions>
            <AdminButton disabled={!canSubmit} type={'submit'}>
              {isSubmitting ? 'Přidává se...' : 'Přidat'}
            </AdminButton>
            <AdminLinkButton
              disabled={isLoadingOrSubmitting}
              to={href('/administration/articles')}
            >
              Zrušit
            </AdminLinkButton>
          </FormActions>
        </Form>
      </FormProvider>
    </AdminPage>
  )
}
