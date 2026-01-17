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
import { AdminImageInput } from '~/components/admin-image-input'
import { AdminImageUploadCard } from '~/components/admin-image-upload-card'
import { AdminInput } from '~/components/admin-input'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AdminRadioInput } from '~/components/admin-radio-input'
import { AdminTextarea } from '~/components/admin-textarea'
import { AdminTextEditor } from '~/components/admin-text-editor'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { Select } from '~/components/select'
import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'
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
}: Route.ComponentProps) {
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: loaderData.selfAuthorId,
      featuredImage: FEATURED_IMAGE_SOURCE.NONE,
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

  const images = fields.images.getFieldList()

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
            <AdminInput
              {...getInputProps(fields.title, { type: 'text' })}
              errors={fields.title.errors}
              label={'Název'}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={'Název článku'}
            />
            <AdminInput
              {...getInputProps(fields.slug, { type: 'text' })}
              errors={fields.slug.errors}
              label={'Slug'}
              onBlur={handleBlur}
              onFocus={handleFocus}
              placeholder={'nazev-clanku'}
            />
          </Fieldset>

          <Fieldset disabled={isLoadingOrSubmitting} legend={'Obsah'}>
            <AdminTextarea
              field={fields.excerpt}
              label={'Výpis článku (excerpt)'}
              textareaProps={{
                disabled: isLoadingOrSubmitting,
                placeholder: 'Krátký výpis článku pro SEO...',
              }}
            />
            <AdminTextEditor
              field={fields.content}
              inputProps={{
                disabled: isLoadingOrSubmitting,
                placeholder: 'Obsah článku...',
              }}
              label={'Obsah článku'}
            />
          </Fieldset>

          <Fieldset disabled={isLoadingOrSubmitting} legend={'Kategorizace'}>
            <Select
              errors={fields.categoryIds.errors}
              label={'Rubriky (můžete vybrat více)'}
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
              label={'Štítky (můžete vybrat více)'}
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
            <AdminRadioInput
              className={styles.defaultFieldFeaturedImageContainer}
              field={fields.featuredImage}
              inputProps={{
                defaultChecked: true,
                value: FEATURED_IMAGE_SOURCE.NONE,
              }}
              label={'Bez hlavního obrázku'}
            />

            {images.map((image, index) => {
              const imageFields = image.getFieldset()
              return (
                <AdminImageUploadCard
                  action={
                    <AdminButton
                      onClick={() => {
                        const currentValue = fields.featuredImage.value
                        if (
                          currentValue ===
                          `${FEATURED_IMAGE_SOURCE.NEW}:${index}`
                        ) {
                          form.update({
                            name: fields.featuredImage.name,
                            value: FEATURED_IMAGE_SOURCE.NONE,
                          })
                        }
                        form.remove({ index, name: fields.images.name })
                      }}
                      type={'button'}
                      variant={'danger'}
                    >
                      <DeleteIcon className={styles.removeIcon} />
                      Odstranit
                    </AdminButton>
                  }
                  key={image.key}
                  title={'Nový obrázek'}
                >
                  <AdminImageInput
                    className={styles.imageFieldFileContainer}
                    field={imageFields.file}
                    label={'Obrázek'}
                  />
                  <AdminInput
                    className={styles.imageFieldAltTextInput}
                    containerClassName={styles.imageFieldAltTextContainer}
                    errors={imageFields.altText.errors}
                    label={'Alt text'}
                    placeholder={
                      'Popis obrázku pro vyhledávače a čtečky obrazovky'
                    }
                    {...getInputProps(imageFields.altText, { type: 'text' })}
                  />
                  <AdminTextEditor
                    className={styles.imageFieldDescriptionContainer}
                    field={imageFields.description}
                    inputProps={{
                      className: styles.imageFieldDescriptionTextarea,
                      placeholder: 'Popis obrázku...',
                    }}
                    label={'Popis obrázku'}
                    toolbar={['link']}
                  />
                  <AdminRadioInput
                    className={styles.fieldFeaturedImageContainer}
                    field={fields.featuredImage}
                    inputProps={{
                      value: `${FEATURED_IMAGE_SOURCE.NEW}:${index}`,
                    }}
                    label={'Použít jako hlavní obrázek'}
                  />
                </AdminImageUploadCard>
              )
            })}

            <AdminButton
              {...form.insert.getButtonProps({ name: fields.images.name })}
            >
              Přidat obrázek
            </AdminButton>
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
