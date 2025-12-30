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
import { AdminInput } from '~/components/admin-input'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AdminTextarea } from '~/components/admin-textarea'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
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
  const { podcastId, episodeId } = params
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: loaderData.episode.authorId,
      description: loaderData.episode.description,
      episodeId: loaderData.episode.id,
      number: loaderData.episode.number,
      podcastId: loaderData.podcastId,
    },
    id: 'edit-episode',
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
      <AdminHeadline>Upravit epizodu</AdminHeadline>

      <Form method={'post'} {...getFormProps(form)} errors={form.errors}>
        <input
          {...getInputProps(fields.podcastId, { type: 'hidden' })}
          defaultValue={fields.podcastId.initialValue}
        />
        <input
          {...getInputProps(fields.episodeId, { type: 'hidden' })}
          defaultValue={fields.episodeId.initialValue}
        />

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Detaily'}>
          <AdminInput
            errors={fields.number.errors}
            label={'Číslo'}
            placeholder={'Číslo epizody'}
            {...getInputProps(fields.number, { type: 'number' })}
          />

          <AdminInput
            errors={fields.title.errors}
            label={'Název'}
            placeholder={'Název epizody'}
            {...getInputProps(fields.title, { type: 'text' })}
          />

          <AdminButtonLink
            disabled={isLoadingOrSubmitting}
            onClick={regenerateSlug}
            type={'button'}
          >
            Vygenerovat nový slug
          </AdminButtonLink>
          <AdminInput
            errors={fields.slug.errors}
            label={'Slug'}
            onBlur={handleBlur}
            placeholder={'nazev-epizody'}
            {...getInputProps(fields.slug, { type: 'text' })}
          />

          <AdminTextarea
            field={fields.description}
            label={'Popis'}
            textareaProps={{
              placeholder: 'Popis epizody',
              rows: 10,
            }}
          />
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

        <AuthenticityTokenInput />

        <FormActions>
          <AdminButton disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Upravuje se...' : 'Uložit'}
          </AdminButton>
          <AdminLinkButton
            disabled={isLoadingOrSubmitting}
            to={href(
              '/administration/podcasts/:podcastId/episodes/:episodeId',
              { episodeId, podcastId },
            )}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
