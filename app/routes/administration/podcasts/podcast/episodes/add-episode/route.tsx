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
import { AdminPage } from '~/components/admin/admin-page'
import { AdminTextarea } from '~/components/admin/admin-textarea'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { Select } from '~/components/select'
import { TextField } from '~/components/text-field'
import { useAutoSlug } from '~/utils/use-auto-slug'
import { schema } from './_schema'
import styles from './_styles.module.css'
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
  const { handleBlur, handleFocus } = useAutoSlug({
    fieldName: fields.slug.name,
    sourceValue: title,
    updateFieldValue: form.update,
  })

  const isLoadingOrSubmitting = state !== 'idle'
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <PageTitle>Nová epizoda</PageTitle>

      <FormProvider context={form.context}>
        <Form method={'post'} {...getFormProps(form)} errors={form.errors}>
          <Fieldset disabled={isLoadingOrSubmitting} legend={'Detaily'}>
            <TextField
              errors={fields.number.errors}
              label={'Číslo'}
              placeholder={'Číslo epizody'}
              {...getInputProps(fields.number, { type: 'number' })}
            />

            <TextField
              errors={fields.title.errors}
              label={'Název'}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={'Název epizody'}
              value={title}
              {...getInputProps(fields.title, { type: 'text' })}
            />

            <TextField
              errors={fields.slug.errors}
              label={'Slug'}
              onBlur={handleBlur}
              onFocus={handleFocus}
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

          <Fieldset disabled={isLoadingOrSubmitting} legend={'Odkazy'}>
            {fields.links.getFieldList().map((link, index) => {
              const linkFields = link.getFieldset()

              return (
                <div className={styles.linkRow} key={link.key}>
                  <TextField
                    {...getInputProps(linkFields.label, { type: 'text' })}
                    errors={linkFields.label.errors}
                    label={'Popisek'}
                    placeholder={'Poslechněte si na Spotify'}
                  />
                  <TextField
                    {...getInputProps(linkFields.url, { type: 'url' })}
                    errors={linkFields.url.errors}
                    label={'URL'}
                    placeholder={'https://open.spotify.com/episode/...'}
                  />
                  <Button
                    {...form.remove.getButtonProps({
                      index,
                      name: fields.links.name,
                    })}
                    variant={'danger'}
                  >
                    <DeleteIcon className={styles.removeIcon} />
                    Odstranit
                  </Button>
                </div>
              )
            })}

            <Button
              {...form.insert.getButtonProps({ name: fields.links.name })}
            >
              Přidat odkaz
            </Button>
          </Fieldset>

          <AuthenticityTokenInput />

          <FormActions>
            <Button disabled={!canSubmit} type={'submit'}>
              {isSubmitting ? 'Přidává se...' : 'Přidat'}
            </Button>
            <LinkButton
              disabled={isLoadingOrSubmitting}
              to={href('/administration/podcasts/:podcastId/episodes', {
                podcastId,
              })}
              variant={'outline'}
            >
              Zrušit
            </LinkButton>
          </FormActions>
        </Form>
      </FormProvider>
    </AdminPage>
  )
}
