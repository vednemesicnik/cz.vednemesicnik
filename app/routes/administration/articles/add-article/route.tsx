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
import { AdminFileInput } from '~/components/admin-file-input'
import { AdminHeadline } from '~/components/admin-headline'
import { AdminImageDeleteButton } from '~/components/admin-image-delete-button'
import { AdminImagePreviewCard } from '~/components/admin-image-preview-card'
import { AdminImagePreviewRadioInputGroup } from '~/components/admin-image-preview-radio-input-group'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AdminRadioInputBase } from '~/components/admin-radio-input-base'
import { AdminTextEditor } from '~/components/admin-text-editor'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { Input } from '~/components/input'
import { Select } from '~/components/select'
import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'
import { useImagesInput } from '~/hooks/use-images-input'
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

  const { handleBlur, handleFocus } = useAutoSlug({
    fieldName: fields.slug.name,
    sourceValue: title,
    updateFieldValue: form.update,
  })

  const {
    fileInputRef,
    filesCount,
    handleFileChange,
    handleToggleDelete,
    previews,
  } = useImagesInput({
    onBeforeToggleDelete: (index) => {
      const currentValue = fields.featuredImage.value
      if (currentValue === `${FEATURED_IMAGE_SOURCE.NEW}:${index}`) {
        form.update({
          name: fields.featuredImage.name,
          value: FEATURED_IMAGE_SOURCE.NONE,
        })
      }
    },
  })

  const isLoadingOrSubmitting = state !== 'idle'
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Přidat článek</AdminHeadline>

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
              onChange={(event) => setTitle(event.target.value)}
              placeholder={'Název článku'}
            />
            <Input
              {...getInputProps(fields.slug, { type: 'text' })}
              errors={fields.slug.errors}
              label={'Slug'}
              onBlur={handleBlur}
              onFocus={handleFocus}
              placeholder={'nazev-clanku'}
            />
          </Fieldset>

          <Fieldset disabled={isLoadingOrSubmitting} legend={'Obsah'}>
            <AdminTextEditor
              {...getInputProps(fields.content, { type: 'text' })}
              disabled={isLoadingOrSubmitting}
              errors={fields.content.errors}
              label={'Obsah článku'}
              placeholder={'Obsah článku...'}
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

          <Fieldset disabled={isLoadingOrSubmitting} legend={'Obrázky'}>
            <AdminFileInput
              accept={'image/*'}
              errors={fields.images.errors}
              filesCount={filesCount}
              label={'Obrázky článku'}
              onFileChange={handleFileChange}
              ref={fileInputRef}
              {...getInputProps(fields.images, { type: 'file' })}
            />

            <AdminImagePreviewRadioInputGroup
              form={fields.featuredImage.formId}
              name={fields.featuredImage.name}
            >
              {previews.map((preview, index) => (
                <AdminImagePreviewCard
                  actions={
                    <AdminImageDeleteButton
                      onClick={handleToggleDelete(index)}
                      toDelete={preview.toDelete}
                    />
                  }
                  alt={`Náhled ${index + 1}`}
                  key={preview.src}
                  previewUrl={preview.src}
                  toDelete={preview.toDelete}
                >
                  <AdminRadioInputBase
                    disabled={preview.toDelete}
                    form={fields.featuredImage.formId}
                    label={'Hlavní obrázek'}
                    name={fields.featuredImage.name}
                    value={`${FEATURED_IMAGE_SOURCE.NEW}:${index}`}
                  />
                </AdminImagePreviewCard>
              ))}
            </AdminImagePreviewRadioInputGroup>
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
