// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  getTextareaProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useEffect, useState } from 'react'
import { useNavigation } from 'react-router'

import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Fieldset } from '~/components/fieldset'
import { FileInput } from '~/components/file-input'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { Input } from '~/components/input'
import { Select } from '~/components/select'
import { TextArea } from '~/components/text-area'
import { slugify } from '~/utils/slugify'
import { schema } from './_schema'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: loaderData.selfAuthorId,
    },
    id: 'add-podcast',
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith('csrf')
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [isSlugFocused, setIsSlugFocused] = useState(false)

  useEffect(() => {
    if (!isSlugFocused) {
      setSlug(slugify(title ?? ''))
    }
  }, [title, isSlugFocused])

  const handleFileChange = (name: string, dirty: boolean) => () => {
    if (dirty) {
      form.validate({ name })
    }
  }

  const isLoadingOrSubmitting = state !== 'idle'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Přidat podcast</AdminHeadline>

      <Form
        encType={'multipart/form-data'}
        method={'post'}
        {...getFormProps(form)}
        errors={form.errors}
      >
        <Fieldset disabled={isLoadingOrSubmitting} legend={'Detaily'}>
          <Input
            errors={fields.title.errors}
            label={'Název'}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={'Název podcastu'}
            value={title}
            {...getInputProps(fields.title, { type: 'text' })}
          />

          <Input
            errors={fields.slug.errors}
            label={'Slug'}
            onChange={(event) => setSlug(slugify(event.target.value))}
            onFocus={() => setIsSlugFocused(true)}
            placeholder={'nazev-podcastu'}
            value={slug}
            {...getInputProps(fields.slug, { type: 'text' })}
          />

          <TextArea
            errors={fields.description.errors}
            label={'Popis'}
            placeholder={'Popis podcastu'}
            {...getTextareaProps(fields.description)}
          />

          <FileInput
            accept={'image'}
            errors={fields.cover.errors}
            label={'Obálka'}
            onChange={handleFileChange(fields.cover.name, fields.cover.dirty)}
            {...getInputProps(fields.cover, { type: 'file' })}
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
          <Button disabled={!canSubmit} type="submit" variant={'primary'}>
            Přidat
          </Button>
          <AdminLinkButton to={'/administration/podcasts'}>
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
