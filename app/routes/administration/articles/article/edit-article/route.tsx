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
import { href, useBlocker, useNavigate, useRevalidator } from 'react-router'
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
import { Callout } from '~/components/callout'
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
import { formatEditHoldLine } from '../../utils/format-edit-hold-line'
import { schema } from './_schema'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ArticleChangedDialog } from './components/article-changed-dialog'
import { CopyArticleTextButton } from './components/copy-article-text-button'
import { CopyArticleTextHint } from './components/copy-article-text-hint'
import { EditHoldDialog } from './components/edit-hold-dialog'
import { HoldTakenDialog } from './components/hold-taken-dialog'
import { formatArticleChangedDescription } from './utils/format-article-changed-description'
import { formatHoldTakenDescription } from './utils/format-hold-taken-description'
import { formatTakeOverDescription } from './utils/format-take-over-description'
import { getReadOnlyNotice } from './utils/get-read-only-notice'
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

// The name of the button Conform submits its intents with.
const CONFORM_INTENT_NAME = '__intent__'

const TAKEN_SLUG_HINT =
  'Zvolte jinou adresu — tuto už má jiný článek. Změna adresy se neuložila.'

// What the editor says once the hold went elsewhere (24h, 24i): which dialog,
// and whether anything stayed unsent.
type HoldLoss = {
  dialog: 'taken' | 'changed' | null
  holderName: string
  hasUnsentChanges: boolean
}

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { article, isApprover } = loaderData
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  // The title the breadcrumb and the tab show, as last loaded.
  const loadedTitleRef = useRef(article.title)
  loadedTitleRef.current = article.title
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
  const isHolding = editHold.state.status === 'holding'
  const hasHeldRef = useRef(false)
  if (isHolding) hasHeldRef.current = true
  // Taken over or changed meanwhile: the editor only reads from now on (24h,
  // 24i) and gets the edit back with a reload.
  const lostHold =
    editHold.state.status === 'lost' || editHold.state.status === 'changed'
      ? editHold.state
      : null
  const readOnlyNotice = getReadOnlyNotice(editHold.state)
  const [holdLoss, setHoldLoss] = useState<HoldLoss | null>(null)

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
  const send = async (
    formData: FormData,
    isRetry = false,
  ): Promise<AutosaveSendResult> => {
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

    // Refused: nobody holds it (the hold expired and was released meanwhile),
    // so it is taken back if nothing was saved since, and the save goes
    // again (24i); or someone does, and the editor learns who (24h). The
    // changes stay unsent: a lost hold stops autosave and says so, and one
    // the editor could not settle waits for *Zkusit znovu*.
    if (result.status === 'not-held') {
      if (result.heldByName === null) {
        if (!isRetry && (await editHold.retake())) return send(formData, true)
      } else {
        await editHold.recheck()
      }
      return 'failed'
    }

    editHold.acknowledgeSave(result.updatedAt)
    setSavedAt(new Date(result.updatedAt))
    setSlugSuggestion(result.slugSuggestion)

    // A new title reaches the breadcrumb and the tab title.
    const savedTitle = String(formData.get(fields.title.name) ?? '').trim()
    if (savedTitle !== loadedTitleRef.current) void revalidator.revalidate()

    return 'saved'
  }

  const autosave = useAutosave({
    getFormData: () =>
      formRef.current === null ? null : new FormData(formRef.current),
    isEnabled: isHolding,
    send,
  })
  leaveSaveRef.current = autosave.getLeaveSave

  // The hold went elsewhere: nothing more goes out, and the editor says
  // whether anything stayed unsent (24h, 24i). Changed meanwhile with nothing
  // lost, there is nothing to rescue: who holds it, as in 24h, or only the
  // line offering the current version.
  const handleHoldLoss = useEffectEvent(async () => {
    const { state } = editHold
    if (state.status !== 'lost' && state.status !== 'changed') return

    const hasUnsentChanges = await autosave.stop()
    const isChangedDialog = state.status === 'changed' && hasUnsentChanges

    // Only an editor that held the edit lost it: one that never did (a
    // takeover over a newer save) has nothing to be told about.
    setHoldLoss({
      dialog: !hasHeldRef.current
        ? null
        : isChangedDialog
          ? 'changed'
          : state.holder === null
            ? null
            : 'taken',
      hasUnsentChanges,
      holderName: state.holder?.name ?? '',
    })
  })
  const lostStatus = lostHold?.status ?? null
  useEffect(() => {
    if (lostStatus !== null) void handleHoldLoss()
  }, [lostStatus])
  const closeHoldLossDialog = () =>
    setHoldLoss((current) =>
      current === null ? null : { ...current, dialog: null },
    )
  const reload = () => window.location.reload()

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
  // Set by a button whose change saves at once instead of after the pause.
  const isFlushOnChangeRef = useRef(false)
  const handleFormChange = useEffectEvent(() => {
    autosave.markChanged()
    if (!isFlushOnChangeRef.current) return
    isFlushOnChangeRef.current = false
    void autosave.flush()
  })
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

  // Nothing posts the form: the editor has no submit button, so Enter in a
  // field does nothing. Conform runs its own `update`, `insert` and `remove`
  // as a submit (every keystroke of the text editor and of a title the address
  // follows); those wait for the pause like typing. Any other submit saves.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    const isConformIntent =
      event.nativeEvent.submitter?.getAttribute('name') === CONFORM_INTENT_NAME
    conformOnSubmit(event)
    event.preventDefault()
    if (!isConformIntent) void autosave.flush()
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
  // Decided once, by the draft as it opened: a reload after a save that makes
  // it non-empty must not stop the address following mid-sentence.
  const [followsTitle] = useState(article.isEmptyDraft)
  const { handleBlur, handleFocus, handleInput } = useAutoSlug({
    fieldName: fields.slug.name,
    sourceValue: followsTitle ? fields.title.value || '' : undefined,
    updateFieldValue: form.update,
  })

  const regenerateSlug = () => {
    form.update({
      name: fields.slug.name,
      value: slugify(fields.title.value || ''),
    })
  }

  // Without the hold nothing can be changed (07g). Lost for good, the editor
  // also drops its toolbar and the buttons that would change something (24h).
  const isLocked = !isHolding
  const isReadOnly = lostHold !== null
  // The text as the author sees it: the editor's own field, read at the click
  // (a disabled fieldset leaves it out of the form's data).
  const getContent = () => {
    const input = formRef.current?.elements.namedItem(fields.content.name)
    return input instanceof HTMLInputElement ? input.value : ''
  }

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
    // the warning what did not make it (24h).
    status:
      !isHolding &&
      (autosave.status === 'pending' || autosave.status === 'saving')
        ? 'idle'
        : autosave.status,
  })

  return (
    <AdminPage>
      <PageTitle>Upravit článek</PageTitle>

      {/* The only sign of saving, without a toast (24e); while only reading,
          who edits it now, or that it is free again (24h). */}
      {lostHold !== null && lostHold.holder !== null ? (
        <p className={styles.saveLine}>
          {formatEditHoldLine({
            holderName: lostHold.holder.name,
            isOwn: false,
            now,
            since: new Date(lostHold.holder.since),
          })}
        </p>
      ) : lostHold?.isEditable ? (
        <p className={styles.saveLine}>
          Článek lze znovu upravovat
          <AdminButtonLink onClick={reload} type={'button'}>
            Pokračovat v úpravě
          </AdminButtonLink>
        </p>
      ) : autosave.status === 'failed' ? (
        <p className={styles.saveLine} role={'alert'}>
          <span className={styles.saveFailure}>{saveLine}</span>
          <AdminButtonLink onClick={autosave.retry} type={'button'}>
            Zkusit znovu
          </AdminButtonLink>
        </p>
      ) : (
        <p className={styles.saveLine}>{saveLine}</p>
      )}

      {readOnlyNotice !== null && (
        <AdminParagraph>{readOnlyNotice}</AdminParagraph>
      )}

      {/* Stays until the editor closes: the only way back to the unsent text
          (24h). */}
      {holdLoss?.hasUnsentChanges && (
        <Callout className={styles.unsentWarning} tone={'warning'}>
          <p className={styles.unsentTitle}>
            Některé změny se nestihly uložit.
          </p>
          <div className={styles.unsentCopy}>
            <CopyArticleTextButton getContent={getContent} />
            <CopyArticleTextHint />
          </div>
          <p className={styles.unsentAdvice}>
            Než editor zavřete nebo budete pokračovat v úpravě, zkopírujte si
            text článku.
          </p>
        </Callout>
      )}

      {holdLoss?.dialog === 'taken' && (
        <HoldTakenDialog
          description={formatHoldTakenDescription({
            hasUnsentChanges: holdLoss.hasUnsentChanges,
            now: new Date(),
            savedAt,
          })}
          getContent={getContent}
          hasUnsentChanges={holdLoss.hasUnsentChanges}
          holderName={holdLoss.holderName}
          onOpenDetail={() => navigate(closeHref)}
          onStay={closeHoldLossDialog}
        />
      )}
      {holdLoss?.dialog === 'changed' &&
        editHold.state.status === 'changed' && (
          <ArticleChangedDialog
            canReload={
              editHold.state.holder === null && editHold.state.isEditable
            }
            description={formatArticleChangedDescription({
              awayMilliseconds: editHold.state.awayMilliseconds,
              now: new Date(),
              savedAt,
            })}
            getContent={getContent}
            onClose={closeHoldLossDialog}
            onOpenDetail={() => navigate(closeHref)}
            onReload={reload}
          />
        )}

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

          <Fieldset disabled={isLocked} legend={'Základní informace'}>
            <TextField
              {...getInputProps(fields.title, { type: 'text' })}
              errors={fields.title.errors}
              label={'Název'}
              placeholder={'Název článku'}
            />
            {!isReadOnly && (
              <AdminButtonLink
                disabled={isLocked}
                onClick={regenerateSlug}
                type="button"
              >
                Vygenerovat nový slug
              </AdminButtonLink>
            )}
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
            {slugSuggestion !== null && !isReadOnly && (
              <AdminButtonLink
                disabled={isLocked}
                onClick={() => {
                  // A chosen address no longer follows the title.
                  handleInput()
                  form.update({ name: fields.slug.name, value: slugSuggestion })
                  // Saved at once (24d), once the field holds it.
                  isFlushOnChangeRef.current = true
                }}
                type={'button'}
              >
                Použít {slugSuggestion}
              </AdminButtonLink>
            )}
          </Fieldset>

          <Fieldset disabled={isLocked} legend={'Obsah'}>
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
              readOnly={isReadOnly}
            />
          </Fieldset>

          <Fieldset disabled={isLocked} legend={'Kategorizace'}>
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

          <Fieldset disabled={isLocked} legend={'Obrázky'}>
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
                    !isReadOnly && (
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
                          form.remove({
                            index,
                            name: fields.existingImages.name,
                          })
                        }}
                        type={'button'}
                        variant={'danger'}
                      >
                        <DeleteIcon className={styles.removeIcon} />
                        Odstranit
                      </Button>
                    )
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
                    readOnly={isReadOnly}
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
                    !isReadOnly && (
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
                    )
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
                    readOnly={isReadOnly}
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

            {!isReadOnly && (
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
            )}
          </Fieldset>

          <Fieldset disabled={isLocked} legend={'Informace o autorech'}>
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
                {index > 0 && !isReadOnly && (
                  <Button
                    onClick={() =>
                      form.remove({ index, name: fields.authorIds.name })
                    }
                    type={'button'}
                    variant={'danger'}
                  >
                    <DeleteIcon className={styles.removeIcon} />
                    Odstranit
                  </Button>
                )}
              </div>
            ))}
            {/* No submit buttons: Enter in a field must not add or remove one. */}
            {!isReadOnly && (
              <Button
                onClick={() =>
                  form.insert({ defaultValue: '', name: fields.authorIds.name })
                }
                type={'button'}
              >
                Přidat autora
              </Button>
            )}
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
