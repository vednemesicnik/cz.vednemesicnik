// noinspection JSUnusedGlobalSymbols

import {
  FormProvider,
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import type { SubmitEvent } from 'react'
import { href, useNavigate, useNavigation } from 'react-router'
import { AdminButtonLink } from '~/components/admin/admin-button-link'
import { AdminDraftRestoreBanner } from '~/components/admin/admin-draft-restore-banner'
import { AdminImageInput } from '~/components/admin/admin-image-input'
import { AdminImageUploadCard } from '~/components/admin/admin-image-upload-card'
import { AdminLeaveConfirmationDialog } from '~/components/admin/admin-leave-confirmation-dialog'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { AdminRadioInput } from '~/components/admin/admin-radio-input'
import { AdminTextEditor } from '~/components/admin/admin-text-editor'
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
import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'
import { useEditHold } from '~/hooks/use-edit-hold'
import {
  clearArticleBackup,
  getArticleBackupKey,
  sanitizeArticleBackupValue,
  writeArticleBackup,
} from '~/utils/article-backup'
import { slugify } from '~/utils/slugify'
import { useAutoSlug } from '~/utils/use-auto-slug'
import { useDraftRestore } from '~/utils/use-draft-restore'
import { useUnsavedChangesGuard } from '~/utils/use-unsaved-changes-guard'
import { schema } from './_schema'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { EditHoldDialog } from './components/edit-hold-dialog'
import { formatTakeOverDescription } from './utils/format-take-over-description'
import { getEditHoldNotice } from './utils/get-edit-hold-notice'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const { article, isApprover } = loaderData
  const { state } = useNavigation()
  const navigate = useNavigate()

  // One tab edits at a time (07g, 24g).
  const editHold = useEditHold({
    action: href('/administration/articles/:articleId/edit-hold', {
      articleId: params.articleId,
    }),
    entity: 'article',
    id: params.articleId,
    isEmpty: article.isEmptyDraft,
    updatedAt: article.updatedAt,
  })
  // A refused save: someone else or another tab holds it now (24h).
  const isSaveRefused = actionData !== undefined && 'heldByName' in actionData
  const holdNotice = getEditHoldNotice(
    isSaveRefused
      ? actionData.heldByName === null
        ? { status: 'changed' }
        : { holderName: actionData.heldByName, status: 'lost' }
      : editHold.state,
  )
  const isHolding = !isSaveRefused && editHold.state.status === 'holding'

  const closeHref = article.isEmptyDraft
    ? href('/administration/articles')
    : href('/administration/articles/:articleId', {
        articleId: params.articleId,
      })

  // Lookup existing image preview URLs by id (form fieldsets only carry schema fields).
  const previewUrlById = new Map(
    article.images.map((image) => [image.id, image.previewUrl]),
  )

  const backupKey = getArticleBackupKey(params.articleId)

  const { backup, defaultValue, formId, restore, discard } = useDraftRestore({
    backupKey,
    baseDefaultValue: {
      authorIds: article.authorIds,
      categoryIds: article.categoryIds,
      content: article.content,
      excerpt: article.excerpt,
      existingImages: article.images.map((image) => ({
        altText: image.altText,
        description: image.description,
        file: undefined,
        id: image.id,
      })),
      featuredImage: article.featuredImageId
        ? `${FEATURED_IMAGE_SOURCE.EXISTING}:${article.featuredImageId}`
        : FEATURED_IMAGE_SOURCE.NONE,
      slug: article.slug,
      tagIds: article.tagIds,
      title: article.title,
    },
    baseFormId: 'edit-article',
  })

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue,
    id: formId,
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    // The tab id arrives after hydration; it is no change of the article.
    shouldDirtyConsider: (field) => {
      return !field.startsWith('csrf') && field !== EDIT_HOLD_CONFIG.tabIdName
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const writeBackup = () => {
    writeArticleBackup(backupKey, {
      savedAt: new Date().toISOString(),
      value: sanitizeArticleBackupValue(form.value as Record<string, unknown>),
    })
  }

  const { blocker, markSubmitting } = useUnsavedChangesGuard({
    isDirty: form.dirty,
    onLeave: writeBackup,
    // Cleared only when the submit actually redirects away (success), so a
    // server error / expired session keeps the backup.
    onSubmittedAway: () => clearArticleBackup(backupKey),
  })

  const { onSubmit: conformOnSubmit, ...formProps } = getFormProps(form)

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    conformOnSubmit(event)
    // Exempt our own submission's redirect from the guard. An invalid submit is
    // prevented by Conform, so skip it.
    if (!event.defaultPrevented) markSubmitting()
  }

  const handleConfirmLeave = () => {
    writeBackup()
    blocker.proceed?.()
  }

  const existingImages = fields.existingImages.getFieldList()
  const newImages = fields.images.getFieldList()

  // A new draft's address follows its title, as the add form's did (0020).
  const { handleBlur, handleFocus, handleInput } = useAutoSlug({
    fieldName: fields.slug.name,
    sourceValue: article.isEmptyDraft ? fields.title.value || '' : undefined,
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
  // Without the hold the editor only reads (07g); #671 draws it fully (24h).
  const isReadOnly = isLoadingOrSubmitting || !isHolding
  const canSubmit = !isReadOnly && form.valid

  return (
    <AdminPage>
      <PageTitle>Upravit článek</PageTitle>

      {holdNotice !== null && <AdminParagraph>{holdNotice}</AdminParagraph>}

      {/* Someone else's edit, only the Coordinator's to take (24g). */}
      {editHold.state.status === 'held-by-other' && isApprover && (
        <EditHoldDialog
          description={formatTakeOverDescription(
            editHold.state.holder,
            new Date(),
          )}
          key={editHold.attempt}
          kind={'take-over'}
          onCancel={() => navigate(closeHref)}
          onConfirm={() => void editHold.takeOver()}
        />
      )}
      {editHold.state.status === 'own-other-tab' && (
        <EditHoldDialog
          key={editHold.attempt}
          kind={'other-tab'}
          onCancel={() => navigate(closeHref)}
          onConfirm={() => void editHold.takeOver()}
        />
      )}

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
          errors={form.errors}
          method={'post'}
          {...formProps}
          onSubmit={handleSubmit}
        >
          <AuthenticityTokenInput />
          <input
            name={fields.editTabId.name}
            type={'hidden'}
            value={editHold.tabId ?? ''}
          />

          <Fieldset disabled={isReadOnly} legend={'Základní informace'}>
            <TextField
              {...getInputProps(fields.title, { type: 'text' })}
              errors={fields.title.errors}
              label={'Název'}
              placeholder={'Název článku'}
            />
            <AdminButtonLink
              disabled={isReadOnly}
              onClick={regenerateSlug}
              type="button"
            >
              Vygenerovat nový slug
            </AdminButtonLink>
            <TextField
              {...getInputProps(fields.slug, { type: 'text' })}
              errors={fields.slug.errors}
              label={'Slug'}
              onBlur={handleBlur}
              onFocus={handleFocus}
              onInput={handleInput}
              placeholder={'nazev-clanku'}
            />
          </Fieldset>

          <Fieldset disabled={isReadOnly} legend={'Obsah'}>
            <AdminTextarea
              field={fields.excerpt}
              label={'Výpis článku (excerpt)'}
              textareaProps={{
                placeholder: 'Krátký výpis článku pro SEO...',
              }}
            />
            <AdminTextEditor
              field={fields.content}
              inputProps={{
                placeholder: 'Obsah článku...',
              }}
              key={form.key}
              label={'Obsah článku'}
            />
          </Fieldset>

          <Fieldset disabled={isReadOnly} legend={'Kategorizace'}>
            <Select
              {...getSelectProps(fields.categoryIds)}
              errors={fields.categoryIds.errors}
              label={'Rubriky (můžete vybrat více)'}
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
              label={'Štítky (můžete vybrat více)'}
              multiple
            >
              {loaderData.tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </Select>
          </Fieldset>

          <Fieldset disabled={isReadOnly} legend={'Obrázky'}>
            <AdminRadioInput
              className={styles.defaultFieldFeaturedImageContainer}
              field={fields.featuredImage}
              inputProps={{
                defaultChecked: !article.featuredImageId,
                value: FEATURED_IMAGE_SOURCE.NONE,
              }}
              label={'Bez hlavního obrázku'}
            />

            {existingImages.map((image, index) => {
              const imageFields = image.getFieldset()
              const imageId = imageFields.id.value

              return (
                <AdminImageUploadCard
                  action={
                    <Button
                      onClick={() => {
                        const currentValue = fields.featuredImage.value
                        if (
                          currentValue ===
                          `${FEATURED_IMAGE_SOURCE.EXISTING}:${imageId}`
                        ) {
                          form.update({
                            name: fields.featuredImage.name,
                            value: FEATURED_IMAGE_SOURCE.NONE,
                          })
                        }
                        form.remove({ index, name: fields.existingImages.name })
                      }}
                      type={'button'}
                      variant={'danger'}
                    >
                      <DeleteIcon className={styles.removeIcon} />
                      Odstranit
                    </Button>
                  }
                  key={image.key}
                  title={'Existující obrázek'}
                >
                  <input
                    {...getInputProps(imageFields.id, { type: 'hidden' })}
                  />

                  <AdminImageInput
                    className={styles.imageFieldFileContainer}
                    field={imageFields.file}
                    label={'Obrázek'}
                    previewUrl={
                      imageId ? previewUrlById.get(imageId) : undefined
                    }
                  />

                  <TextField
                    {...getInputProps(imageFields.altText, { type: 'text' })}
                    className={styles.imageFieldAltTextContainer}
                    errors={imageFields.altText.errors}
                    label={'Alt text'}
                    placeholder={
                      'Popis obrázku pro vyhledávače a čtečky obrazovky'
                    }
                  />

                  <AdminTextEditor
                    className={styles.imageFieldDescriptionContainer}
                    field={imageFields.description}
                    inputProps={{
                      placeholder: 'Popis obrázku...',
                    }}
                    label={'Popis obrázku'}
                    toolbar={['link']}
                  />

                  <AdminRadioInput
                    className={styles.fieldFeaturedImageContainer}
                    field={fields.featuredImage}
                    inputProps={{
                      value: `${FEATURED_IMAGE_SOURCE.EXISTING}:${imageId}`,
                    }}
                    label={'Použít jako hlavní obrázek'}
                  />
                </AdminImageUploadCard>
              )
            })}

            {newImages.map((image, index) => {
              const imageFields = image.getFieldset()
              return (
                <AdminImageUploadCard
                  action={
                    <Button
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
                    </Button>
                  }
                  key={image.key}
                  title={'Nový obrázek'}
                >
                  <AdminImageInput
                    className={styles.imageFieldFileContainer}
                    field={imageFields.file}
                    label={'Obrázek'}
                  />
                  <TextField
                    {...getInputProps(imageFields.altText, { type: 'text' })}
                    className={styles.imageFieldAltTextContainer}
                    errors={imageFields.altText.errors}
                    label={'Alt text'}
                    placeholder={
                      'Popis obrázku pro vyhledávače a čtečky obrazovky'
                    }
                  />
                  <AdminTextEditor
                    className={styles.imageFieldDescriptionContainer}
                    field={imageFields.description}
                    inputProps={{
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

            <Button
              {...form.insert.getButtonProps({ name: fields.images.name })}
            >
              Přidat obrázek
            </Button>
          </Fieldset>

          <Fieldset disabled={isReadOnly} legend={'Informace o autorech'}>
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
                  <Button
                    {...form.remove.getButtonProps({
                      index,
                      name: fields.authorIds.name,
                    })}
                    variant={'danger'}
                  >
                    <DeleteIcon className={styles.removeIcon} />
                    Odstranit
                  </Button>
                )}
              </div>
            ))}
            <Button
              {...form.insert.getButtonProps({
                defaultValue: '',
                name: fields.authorIds.name,
              })}
            >
              Přidat autora
            </Button>
          </Fieldset>

          <FormActions>
            <Button disabled={!canSubmit} type={'submit'}>
              {isSubmitting ? 'Ukládá se...' : 'Uložit'}
            </Button>
            <LinkButton
              disabled={isLoadingOrSubmitting}
              to={closeHref}
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
