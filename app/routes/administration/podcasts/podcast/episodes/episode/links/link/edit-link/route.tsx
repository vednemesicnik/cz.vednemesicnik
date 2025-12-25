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
import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { Input } from '~/components/input'
import { Select } from '~/components/select'
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
  const { podcastId, episodeId, linkId } = params
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: loaderData.link.authorId,
      episodeId: loaderData.episode.id,
      label: loaderData.link.label,
      linkId: loaderData.link.id,
      podcastId: loaderData.podcast.id,
      url: loaderData.link.url,
    },
    id: 'edit-link',
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
      <AdminHeadline>Upravit odkaz</AdminHeadline>

      <Form method={'post'} {...getFormProps(form)} errors={form.errors}>
        <input
          {...getInputProps(fields.podcastId, { type: 'hidden' })}
          defaultValue={fields.podcastId.initialValue}
        />
        <input
          {...getInputProps(fields.episodeId, { type: 'hidden' })}
          defaultValue={fields.episodeId.initialValue}
        />
        <input
          {...getInputProps(fields.linkId, { type: 'hidden' })}
          defaultValue={fields.linkId.initialValue}
        />

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Detaily'}>
          <Input
            errors={fields.label.errors}
            label={'Štítek'}
            placeholder={'Poslechněte si na Spotify'}
            {...getInputProps(fields.label, { type: 'text' })}
          />
          <Input
            errors={fields.url.errors}
            label={'URL'}
            placeholder={'https://open.spotify.com/episode/...'}
            {...getInputProps(fields.url, { type: 'url' })}
          />
        </Fieldset>

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Autor'}>
          <Select
            errors={fields.authorId.errors}
            label={'Autor'}
            {...getSelectProps(fields.authorId)}
          >
            {loaderData.authors.map((author) => {
              return (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              )
            })}
          </Select>
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <AdminButton disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Ukládá se...' : 'Uložit'}
          </AdminButton>
          <AdminLinkButton
            disabled={isLoadingOrSubmitting}
            to={href(
              '/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId',
              { episodeId, linkId, podcastId },
            )}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
