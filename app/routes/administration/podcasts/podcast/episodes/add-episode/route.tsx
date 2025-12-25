// noinspection JSUnusedGlobalSymbols
import {
  getFormProps,
  getInputProps,
  getSelectProps,
  getTextareaProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useState } from 'react'
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
  params,
}: Route.ComponentProps) {
  const { podcastId } = params
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: loaderData.selfAuthorId,
      description: '',
      podcastId: loaderData.podcast.id,
    },
    id: 'add-episode',
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
      <AdminHeadline>Přidat epizodu</AdminHeadline>

      <Form method={'post'} {...getFormProps(form)} errors={form.errors}>
        <Fieldset disabled={isLoadingOrSubmitting} legend={'Detaily'}>
          <Input
            errors={fields.number.errors}
            label={'Číslo'}
            placeholder={'Číslo epizody'}
            {...getInputProps(fields.number, { type: 'number' })}
          />

          <Input
            errors={fields.title.errors}
            label={'Název'}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={'Název epizody'}
            value={title}
            {...getInputProps(fields.title, { type: 'text' })}
          />

          <Input
            errors={fields.slug.errors}
            label={'Slug'}
            onBlur={() => setSlug((value) => slugify(value))}
            onChange={(event) => setSlug(event.target.value)}
            onFocus={() => setIsSlugFocused(true)}
            placeholder={'nazev-epizody'}
            value={slug}
            {...getInputProps(fields.slug, { type: 'text' })}
          />

          <TextArea
            errors={fields.description.errors}
            label={'Popis'}
            placeholder={'Popis epizody'}
            {...getTextareaProps(fields.description)}
          />
        </Fieldset>

        <input
          {...getInputProps(fields.podcastId, { type: 'hidden' })}
          defaultValue={fields.podcastId.initialValue}
        />

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

        <AuthenticityTokenInput />

        <FormActions>
          <AdminButton disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Přidává se...' : 'Přidat'}
          </AdminButton>
          <AdminLinkButton
            disabled={isLoadingOrSubmitting}
            to={href('/administration/podcasts/:podcastId/episodes', {
              podcastId,
            })}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
