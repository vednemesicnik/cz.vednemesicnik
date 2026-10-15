// noinspection JSUnusedGlobalSymbols

import {
  FormProvider,
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { createId } from '@paralleldrive/cuid2'
import {
  type FormEvent,
  type MouseEvent,
  type SubmitEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react'
import { href, useBlocker, useNavigate } from 'react-router'
import { AdminButtonLink } from '~/components/admin/admin-button-link'
import { AdminImageInput } from '~/components/admin/admin-image-input'
import { AdminImageUploadCard } from '~/components/admin/admin-image-upload-card'
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
import { FORM_CONFIG } from '~/config/form-config'
import { type AutosaveSendResult, useAutosave } from '~/hooks/use-autosave'
import { useEditHold } from '~/hooks/use-edit-hold'
import { isSaveShortcut } from '~/utils/autosave/is-save-shortcut'
import { slugify } from '~/utils/slugify'
import { useAutoSlug } from '~/utils/use-auto-slug'
import { schema } from './_schema'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { EditHoldDialog } from './components/edit-hold-dialog'
import { formatTakeOverDescription } from './utils/format-take-over-description'
import { getEditHoldNotice } from './utils/get-edit-hold-notice'
import { getSaveLineText } from './utils/get-save-line-text'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

// What the save route answers (decision 0022).
type SaveResponse =
  | { status: 'saved'; updatedAt: string; slugSuggestion: string | null }
  | { status: 'not-held'; heldByName: string | null }

// The tab's own fields are no change of the article.
const SNAPSHOT_IGNORED_FIELDS = new Set<string>([
  FORM_CONFIG.authenticityToken.name,
  EDIT_HOLD_CONFIG.tabIdName,
])

const TAKEN_SLUG_HINT =
  'Zvolte jinou adresu — tuto už má jiný článek. Změna adresy se neuložila.'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { article, isApprover } = loaderData
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const saveAction = href('/administration/articles/:articleId/save', {
    articleId: params.articleId,
  })

  // Autosave is set up after the hold; a closing page asks it through this.
  const leaveSaveRef = useRef<() => FormData | null>(() => null)

  // One tab edits at a time (07g, 24g).
  const editHold = useEditHold({
    action: href('/administration/articles/:articleId/edit-hold', {
      articleId: params.articleId,
    }),
    entity: 'article',
    id: params.articleId,
    isEmpty: article.isEmptyDraft,
    leaveSave: {
      action: saveAction,
      getFormData: () => leaveSaveRef.current(),
    },
    updatedAt: article.updatedAt,
  })
  // A refused save: someone else or another tab holds it now (24h). `undefined`
  // while no save was refused.
  const [refusedHolderName, setRefusedHolderName] = useState<
    string | null | undefined
  >(undefined)
  const isSaveRefused = refusedHolderName !== undefined
  const holdNotice = getEditHoldNotice(
    isSaveRefused
      ? refusedHolderName === null
        ? { status: 'changed' }
        : { holderName: refusedHolderName, status: 'lost' }
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

  const [form, fields] = useForm({
    defaultValue: {
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
    id: 'edit-article',
    // Parsed here so Conform runs `update`, `insert` and `remove` in the page;
    // the schema refuses nothing a draft may lack (24d).
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
  })

  // The article's last save, as the line under the heading says it (24e).
  const [savedAt, setSavedAt] = useState(() => new Date(article.updatedAt))
  // A free address for a taken one, which did not save (24d).
  const [slugSuggestion, setSlugSuggestion] = useState<string | null>(null)

  // One save of the whole form; the server takes it only from this tab.
  const send = async (formData: FormData): Promise<AutosaveSendResult> => {
    let response: Response

    try {
      response = await fetch(saveAction, { body: formData, method: 'POST' })
    } catch {
      return 'offline'
    }

    // An expired session redirects to the sign-in page.
    if (response.redirected || (!response.ok && response.status !== 409)) {
      return 'failed'
    }

    let result: SaveResponse
    try {
      result = (await response.json()) as SaveResponse
    } catch {
      return 'failed'
    }

    if (result.status === 'not-held') {
      setRefusedHolderName(result.heldByName)
      return 'stopped'
    }

    editHold.acknowledgeSave(result.updatedAt)
    setSavedAt(new Date(result.updatedAt))
    setSlugSuggestion(result.slugSuggestion)
    return 'saved'
  }

  const autosave = useAutosave({
    getFormData: () =>
      formRef.current === null ? null : new FormData(formRef.current),
    isEnabled: isHolding,
    send,
  })
  leaveSaveRef.current = autosave.getLeaveSave

  // Every change of the form, typed or set by a button, saves (24e). Only
  // once the author touched it: the form reads empty while its fieldsets wait
  // for the hold, and coming back is no change.
  const hasInteractedRef = useRef(false)
  const markInteracted = () => {
    hasInteractedRef.current = true
  }
  const snapshot = JSON.stringify(form.value ?? {}, (key, value) =>
    SNAPSHOT_IGNORED_FIELDS.has(key)
      ? undefined
      : value instanceof File
        ? `${value.name}:${value.size}:${value.lastModified}`
        : value,
  )
  const snapshotRef = useRef(snapshot)
  const handleFormChange = useEffectEvent(() => autosave.markChanged())
  useEffect(() => {
    if (snapshot === snapshotRef.current) return
    snapshotRef.current = snapshot
    if (hasInteractedRef.current) handleFormChange()
  }, [snapshot])

  // The platform's save shortcut saves at once (24e).
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const platform =
      (navigator as Navigator & { userAgentData?: { platform: string } })
        .userAgentData?.platform ?? navigator.platform

    if (!isSaveShortcut(event, platform)) return
    event.preventDefault()
    void autosave.flush()
  })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleKeyDown(event)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // The line's „dnes“ turns into a date after midnight.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Leaving sends what waits first. Offline or after a failure the leave
  // becomes a full page load, so the browser's own dialog asks (24e).
  const leaveTo = async (to: string, goInApp: () => void) => {
    if (await autosave.flush()) {
      goInApp()
    } else {
      window.location.assign(to)
    }
  }

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname &&
      autosave.hasUnsavedChanges(),
  )
  const handleBlocked = useEffectEvent(() => {
    if (blocker.state !== 'blocked') return
    const { pathname, search, hash } = blocker.location
    const to = `${pathname}${search}${hash}`

    void leaveTo(to, () => blocker.proceed()).finally(() => {
      if (blocker.state === 'blocked') blocker.reset()
    })
  })
  useEffect(() => {
    if (blocker.state === 'blocked') handleBlocked()
  }, [blocker.state])

  const { onSubmit: conformOnSubmit, ...formProps } = getFormProps(form)

  // Enter saves instead of posting; Conform still runs its list buttons.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    conformOnSubmit(event)
    event.preventDefault()
    void autosave.flush()
  }

  // A picked file is a change even before Conform reads it.
  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    if (
      event.target instanceof HTMLInputElement &&
      event.target.type === 'file'
    ) {
      autosave.markChanged()
    }
  }

  const handleClose = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    void leaveTo(closeHref, () => navigate(closeHref))
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

  // Without the hold the editor only reads (07g); #671 draws it fully (24h).
  const isReadOnly = !isHolding

  const isEmpty =
    !fields.title.value &&
    !fields.content.value &&
    existingImages.length === 0 &&
    newImages.length === 0

  const saveLine = getSaveLineText({
    isEmpty,
    isSlugUnsaved: slugSuggestion !== null,
    now,
    savedAt,
    // Without the hold nothing goes out: the line says the last save, and
    // #671 says what did not make it (24h).
    status:
      !isHolding &&
      (autosave.status === 'pending' || autosave.status === 'saving')
        ? 'idle'
        : autosave.status,
  })

  return (
    <AdminPage>
      <PageTitle>Upravit článek</PageTitle>

      {/* The only sign of saving, without a toast (24e). */}
      {autosave.status === 'failed' ? (
        <p className={styles.saveLine} role={'alert'}>
          <span className={styles.saveFailure}>{saveLine}</span>
          <AdminButtonLink onClick={autosave.retry} type={'button'}>
            Zkusit znovu
          </AdminButtonLink>
        </p>
      ) : (
        <p className={styles.saveLine}>{saveLine}</p>
      )}

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

      <FormProvider context={form.context}>
        <Form
          encType={'multipart/form-data'}
          method={'post'}
          {...formProps}
          // Leaving a field saves at once (24e).
          onBlur={() => void autosave.flush()}
          onChange={handleChange}
          onChangeCapture={markInteracted}
          onClickCapture={markInteracted}
          onInputCapture={markInteracted}
          onSubmit={handleSubmit}
          ref={formRef}
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
              errors={slugSuggestion === null ? undefined : [TAKEN_SLUG_HINT]}
              label={'Slug'}
              onBlur={handleBlur}
              onFocus={handleFocus}
              onInput={handleInput}
              placeholder={'nazev-clanku'}
            />
            {/* A taken address: a free one, filled in and saved (24d). */}
            {slugSuggestion !== null && (
              <AdminButtonLink
                disabled={isReadOnly}
                onClick={() => {
                  // A chosen address no longer follows the title.
                  handleInput()
                  form.update({ name: fields.slug.name, value: slugSuggestion })
                }}
                type={'button'}
              >
                Použít {slugSuggestion}
              </AdminButtonLink>
            )}
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
                  {/* Made here, so a repeated save stores the image once. */}
                  <input
                    {...getInputProps(imageFields.id, { type: 'hidden' })}
                  />
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
              onClick={() =>
                form.insert({
                  defaultValue: { id: createId() },
                  name: fields.images.name,
                })
              }
              type={'button'}
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
            {/* Sends what waits, then leaves (24e). */}
            <LinkButton
              onClick={handleClose}
              to={closeHref}
              variant={'outline'}
            >
              Zavřít
            </LinkButton>
          </FormActions>
        </Form>
      </FormProvider>
    </AdminPage>
  )
}
