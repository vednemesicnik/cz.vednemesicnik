// noinspection JSUnusedGlobalSymbols

import {
  FormProvider,
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { type FormEvent, useState } from 'react'
import { href, useNavigation } from 'react-router'
import { AdminButton } from '~/components/admin/admin-button'
import { AdminDraftRestoreBanner } from '~/components/admin/admin-draft-restore-banner'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminImageInput } from '~/components/admin/admin-image-input'
import { AdminImageUploadCard } from '~/components/admin/admin-image-upload-card'
import { AdminInput } from '~/components/admin/admin-input'
import { AdminLeaveConfirmationDialog } from '~/components/admin/admin-leave-confirmation-dialog'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminRadioInput } from '~/components/admin/admin-radio-input'
import { AdminTextEditor } from '~/components/admin/admin-text-editor'
import { AdminTextarea } from '~/components/admin/admin-textarea'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { Select } from '~/components/select'
import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'
import {
  clearArticleBackup,
  getArticleBackupKey,
  writeArticleBackup,
} from '~/utils/article-backup'
import { useAutoSlug } from '~/utils/use-auto-slug'
import { useDraftRestore } from '~/utils/use-draft-restore'
import { useUnsavedChangesGuard } from '~/utils/use-unsaved-changes-guard'
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

  const backupKey = getArticleBackupKey()

  const { backup, defaultValue, formId, restore, discard } = useDraftRestore({
    backupKey,
    baseDefaultValue: {
      authorIds: [loaderData.selfAuthorId],
      featuredImage: FEATURED_IMAGE_SOURCE.NONE,
    },
    baseFormId: 'add-article',
  })

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue,
    id: formId,
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith('csrf')
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const writeBackup = () => {
    // Exclude the CSRF token — it doesn't belong in localStorage and the form
    // renders a fresh one anyway (mirrors shouldDirtyConsider).
    const { csrf: _csrf, ...value } = form.value as Record<string, unknown>
    writeArticleBackup(backupKey, {
      savedAt: new Date().toISOString(),
      value,
    })
  }

  const { blocker, markSubmitting } = useUnsavedChangesGuard({
    isDirty: form.dirty,
    onLeave: writeBackup,
  })

  const { onSubmit: conformOnSubmit, ...formProps } = getFormProps(form)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    conformOnSubmit(event)
    // Only a valid submit navigates; clear the backup and exempt the redirect
    // from the guard. An invalid submit is prevented by Conform, so skip both.
    if (!event.defaultPrevented) {
      markSubmitting()
      clearArticleBackup(backupKey)
    }
  }

  const handleConfirmLeave = () => {
    writeBackup()
    blocker.proceed?.()
  }

  const [title, setTitle] = useState('')

  const { handleBlur, handleFocus } = useAutoSlug({
    fieldName: fields.slug.name,
    sourceValue: title,
    updateFieldValue: form.update,
  })

  const images = fields.images.getFieldList()

  const handleAddImage = () => {
    if (images.length === 0) {
      form.update({
        name: fields.featuredImage.name,
        value: `${FEATURED_IMAGE_SOURCE.NEW}:0`,
      })
    }
    form.insert({ name: fields.images.name })
  }

  const isLoadingOrSubmitting = state !== 'idle'
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Přidat článek</AdminHeadline>

      {backup !== null && (
        <AdminDraftRestoreBanner
          onDiscard={discard}
          onRestore={restore}
          savedAt={backup.savedAt}
        />
      )}

      <AdminLeaveConfirmationDialog
        blocker={blocker}
        onConfirmLeave={handleConfirmLeave}
      />

      <FormProvider context={form.context}>
        <Form
          encType={'multipart/form-data'}
          method={'post'}
          {...formProps}
          onSubmit={handleSubmit}
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
              key={form.key}
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

            <AdminButton onClick={handleAddImage} type={'button'}>
              Přidat obrázek
            </AdminButton>
          </Fieldset>

          <Fieldset
            disabled={isLoadingOrSubmitting}
            legend={'Informace o autorech'}
          >
            {fields.authorIds.getFieldList().map((authorField, index) => (
              <div className={styles.authorRow} key={authorField.key}>
                <Select
                  {...getSelectProps(authorField)}
                  errors={authorField.errors}
                  label={'Autor'}
                >
                  <option value={''}>— vyberte autora —</option>
                  {loaderData.authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </Select>
                {index > 0 && (
                  <AdminButton
                    {...form.remove.getButtonProps({
                      index,
                      name: fields.authorIds.name,
                    })}
                    variant={'danger'}
                  >
                    <DeleteIcon className={styles.removeIcon} />
                    Odstranit
                  </AdminButton>
                )}
              </div>
            ))}
            <AdminButton
              {...form.insert.getButtonProps({
                defaultValue: '',
                name: fields.authorIds.name,
              })}
            >
              Přidat autora
            </AdminButton>
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
