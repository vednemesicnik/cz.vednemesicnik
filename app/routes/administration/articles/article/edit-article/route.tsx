// noinspection JSUnusedGlobalSymbols

import {
  FormProvider,
  getCollectionProps,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { createId } from '@paralleldrive/cuid2'
import { clsx } from 'clsx'
import {
  type FormEvent,
  type MouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type SubmitEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react'
import { href, useBlocker, useNavigate, useRevalidator } from 'react-router'
import { AdminDetailAside } from '~/components/admin/admin-detail-aside'
import { AdminDetailLayout } from '~/components/admin/admin-detail-layout'
import { AdminDetailMain } from '~/components/admin/admin-detail-main'
import { AdminImageInput } from '~/components/admin/admin-image-input'
import { AdminImageUploadCard } from '~/components/admin/admin-image-upload-card'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { AdminRadioInput } from '~/components/admin/admin-radio-input'
import { AdminTextarea } from '~/components/admin/admin-textarea'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { ButtonLink } from '~/components/button-link'
import { Callout } from '~/components/callout'
import { Checkbox } from '~/components/checkbox'
import { Chip } from '~/components/chip'
import { ChipInput } from '~/components/chip-input'
import { Form } from '~/components/form'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { StatusTag } from '~/components/status-tag'
import { TextEditor } from '~/components/text-editor'
import { TextField } from '~/components/text-field'
import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'
import { FORM_CONFIG } from '~/config/form-config'
import { type AutosaveSendResult, useAutosave } from '~/hooks/use-autosave'
import { useEditHold } from '~/hooks/use-edit-hold'
import { isSaveShortcut } from '~/utils/autosave/is-save-shortcut'
import { foldForSearch } from '~/utils/fold-for-search'
import { createImageSources } from '~/utils/image-store/create-image-sources'
import { slugify } from '~/utils/slugify'
import { useAutoSlug } from '~/utils/use-auto-slug'
import { formatEditHoldLine } from '../../utils/format-edit-hold-line'
import { formatSubmissionFact } from '../../utils/format-submission-fact'
import { schema } from './_schema'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ArticleChangedDialog } from './components/article-changed-dialog'
import { AuthorList } from './components/author-list'
import { AuthorListItem } from './components/author-list-item'
import { CopyArticleTextButton } from './components/copy-article-text-button'
import { CopyArticleTextHint } from './components/copy-article-text-hint'
import { EditHoldDialog } from './components/edit-hold-dialog'
import { EditorDetail } from './components/editor-detail'
import { HoldTakenDialog } from './components/hold-taken-dialog'
import { formatArticleChangedDescription } from './utils/format-article-changed-description'
import { formatFirstNameAndCount } from './utils/format-first-name-and-count'
import { formatHoldTakenDescription } from './utils/format-hold-taken-description'
import { formatTakeOverDescription } from './utils/format-take-over-description'
import { getEditorSentence } from './utils/get-editor-sentence'
import { getReadOnlyNotice } from './utils/get-read-only-notice'
import { getSaveLineText } from './utils/get-save-line-text'
import { useRemovedIds } from './utils/use-removed-ids'

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

// Up to this length a search engine shows the perex whole (24a).
const PEREX_RECOMMENDED_LENGTH = 160

// Below it the details are rows that open over the whole screen (24f).
const DETAIL_COLUMN_QUERY = '(width >= 768px)'

type DetailName = 'address' | 'authors' | 'categories' | 'tags' | 'images'

// An author whose row is missing from the options shows the initials.
const NO_IMAGE = createImageSources('user-image', undefined)

// A Conform value of a multi-value field, as a list.
const toList = (value: string | Array<string | undefined> | undefined) =>
  (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => item !== undefined && item !== '',
  )

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
  const { article, isApprover, isOwn } = loaderData
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
      existingImages: article.images.map((image) => ({
        altText: image.altText,
        description: image.description,
        file: undefined,
        id: image.id,
      })),
      featuredImage: article.featuredImageId
        ? `${FEATURED_IMAGE_SOURCE.EXISTING}:${article.featuredImageId}`
        : FEATURED_IMAGE_SOURCE.NONE,
      perex: article.perex,
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

  // The address follows the title until changed by hand (24a): one that
  // differs from the title's as the editor opens was changed by hand.
  const [isSlugInitiallyManual] = useState(
    article.slug !== '' && article.slug !== slugify(article.title),
  )
  const {
    handleBlur,
    handleFocus,
    handleInput,
    isFollowing: isSlugFollowing,
    resume: resumeSlug,
  } = useAutoSlug({
    fieldName: fields.slug.name,
    fieldValue: fields.slug.value ?? '',
    // Without the hold the fields are disabled and read as empty (07g).
    isEnabled: isHolding,
    isInitiallyTouched: isSlugInitiallyManual,
    sourceValue: fields.title.value || '',
    updateFieldValue: form.update,
  })

  // The heading says *Nový článek* for the draft that opened empty (24a).
  const [isNewArticle] = useState(article.isEmptyDraft)

  // The categories and tags as the editor opened: an archived one stays in
  // the list after it is unticked, so a mistake can be undone (24a).
  const [categoryOptions] = useState(loaderData.categories)
  const [tagOptions] = useState(loaderData.tags)
  const selectedCategoryIds = toList(fields.categoryIds.value)
  // Kept here: the hidden inputs are rendered from them, so the form has none
  // to read them from before the first pick.
  const [selectedTagIds, setSelectedTagIds] = useState(article.tagIds)
  const removedCategoryIds = useRemovedIds(
    article.categoryIds,
    selectedCategoryIds,
  )
  const removedTagIds = useRemovedIds(article.tagIds, selectedTagIds)
  const publishedCategories = categoryOptions.filter(
    (category) => category.state === 'published',
  )
  const otherCategories = categoryOptions.filter(
    (category) => category.state !== 'published',
  )

  // Tags by search: only published ones not picked yet are offered.
  const [tagQuery, setTagQuery] = useState('')
  const foldedTagQuery = foldForSearch(tagQuery.trim())
  const tagSuggestions = tagOptions
    .filter(
      (tag) =>
        tag.state === 'published' &&
        !selectedTagIds.includes(tag.id) &&
        foldForSearch(tag.name).includes(foldedTagQuery),
    )
    .map((tag) => ({ label: tag.name, value: tag.id }))
  const setTagIds = (tagIds: string[]) => {
    setSelectedTagIds(tagIds)
    // Hidden inputs change without an event, so the change is said here.
    autosave.markChanged()
  }

  // Authors as rows with a search under them (24j). Only the Coordinator
  // picks freely: without themselves, and the association. Everyone else
  // keeps their own row and adds or removes co-authors (mto4s7s7).
  const { canChooseAuthorsFreely, canCreateAuthor, ownAuthorId } = loaderData
  const [selectedAuthorIds, setSelectedAuthorIds] = useState(article.authorIds)
  const authorById = new Map(
    loaderData.authors.map((author) => [author.id, author]),
  )
  const [authorQuery, setAuthorQuery] = useState('')
  const foldedAuthorQuery = foldForSearch(authorQuery.trim())
  const authorSuggestions = loaderData.authors
    .filter(
      (author) =>
        !selectedAuthorIds.includes(author.id) &&
        (canChooseAuthorsFreely || !author.isAssociation) &&
        foldForSearch(author.name).includes(foldedAuthorQuery),
    )
    .map((author) => ({
      avatar: author.image,
      label: author.name,
      note: author.roleLabel ?? undefined,
      value: author.id,
    }))
  // *Založit autora* stays the last option, under matches too, until the
  // typed name is exactly an author's (ivyin4kr).
  const isAuthorNameNew = !loaderData.authors.some(
    (author) => foldForSearch(author.name) === foldedAuthorQuery,
  )
  // The Coordinator need not add a co-author (24j).
  const authorSearchLabel = canChooseAuthorsFreely
    ? 'Hledat autora'
    : 'Přidat spoluautora'
  // The last author stays: an article always has one (24j).
  const canRemoveAuthor = (authorId: string) =>
    selectedAuthorIds.length > 1 &&
    (canChooseAuthorsFreely || authorId !== ownAuthorId)
  const authorListRef = useRef<HTMLUListElement>(null)
  const authorSearchRef = useRef<HTMLInputElement>(null)
  // After a removal the focus goes to the next row's ×, or to the search.
  const authorFocusIndexRef = useRef<number | null>(null)
  const removeAuthor = (index: number) => {
    authorFocusIndexRef.current = index
    setSelectedAuthorIds(selectedAuthorIds.filter((_, at) => at !== index))
  }

  // An added or removed author saves at once, without a dialog (24j): once
  // the hidden inputs carry the change.
  const authorIdsKey = selectedAuthorIds.join(' ')
  const authorIdsKeyRef = useRef(authorIdsKey)
  const handleAuthorsChange = useEffectEvent(() => {
    autosave.markChanged()
    void autosave.flush()

    const focusIndex = authorFocusIndexRef.current
    if (focusIndex === null) return
    authorFocusIndexRef.current = null
    const nextRemoveButton = authorListRef.current?.children
      .item(focusIndex)
      ?.querySelector('button')
    ;(nextRemoveButton ?? authorSearchRef.current)?.focus()
  })
  useEffect(() => {
    if (authorIdsKey === authorIdsKeyRef.current) return
    authorIdsKeyRef.current = authorIdsKey
    handleAuthorsChange()
  }, [authorIdsKey])

  // Back from *Založit autora*, the new author is chosen (24j, 28c), once
  // the hold allows a save. The address drops it without a revalidation, so a
  // reload does not add the author again.
  const [createdAuthorId] = useState(() =>
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('author'),
  )
  const hasAddedCreatedAuthorRef = useRef(false)
  const addCreatedAuthor = useEffectEvent(() => {
    if (hasAddedCreatedAuthorRef.current || createdAuthorId === null) return
    hasAddedCreatedAuthorRef.current = true

    const url = new URL(window.location.href)
    url.searchParams.delete('author')
    window.history.replaceState(window.history.state, '', url)

    if (
      authorById.has(createdAuthorId) &&
      !selectedAuthorIds.includes(createdAuthorId)
    ) {
      setSelectedAuthorIds([...selectedAuthorIds, createdAuthorId])
    }
  })
  useEffect(() => {
    if (isHolding) addCreatedAuthor()
  }, [isHolding])

  // One detail open over the whole screen on a phone (24f).
  const [openDetail, setOpenDetail] = useState<DetailName | null>(null)
  const isDetailOpen = openDetail !== null
  const detailProps = (name: DetailName) => ({
    isInert: isDetailOpen && openDetail !== name,
    isOpen: openDetail === name,
    onClose: () => setOpenDetail(null),
    onOpen: () => setOpenDetail(name),
  })
  useEffect(() => {
    const columnQuery = window.matchMedia(DETAIL_COLUMN_QUERY)
    const handleWidthChange = () => {
      if (columnQuery.matches) setOpenDetail(null)
    }
    columnQuery.addEventListener('change', handleWidthChange)
    return () => columnQuery.removeEventListener('change', handleWidthChange)
  }, [])

  // Enter in the title saves instead of breaking it; a pasted break goes.
  const handleTitleKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    void autosave.flush()
  }
  const handleTitleInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget
    if (/[\r\n]/.test(textarea.value)) {
      textarea.value = textarea.value.replace(/[\r\n]+/g, ' ')
    }
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

  // The only sign of saving, without a toast (24e); while only reading, who
  // edits it now, or that it is free again (24h). The same line stands in the
  // header, in the phone's bar and over an open detail (24f).
  const renderSaveLine = (prefix?: string) =>
    lostHold !== null && lostHold.holder !== null ? (
      <p className={styles.saveLine}>
        {prefix}
        {formatEditHoldLine({
          holderName: lostHold.holder.name,
          isOwn: false,
          now,
          since: new Date(lostHold.holder.since),
        })}
      </p>
    ) : lostHold?.isEditable ? (
      <p className={styles.saveLine}>
        {prefix}
        Článek lze znovu upravovat
        <ButtonLink onClick={reload} type={'button'}>
          Pokračovat v úpravě
        </ButtonLink>
      </p>
    ) : autosave.status === 'failed' ? (
      <p className={styles.saveLine} role={'alert'}>
        {prefix}
        <span className={styles.saveFailure}>{saveLine}</span>
        <ButtonLink onClick={autosave.retry} type={'button'}>
          Zkusit znovu
        </ButtonLink>
      </p>
    ) : (
      <p className={styles.saveLine}>
        {prefix}
        {saveLine}
      </p>
    )

  // Over someone else's text, whose it is and since when it waits (24c).
  const ownerPrefix = isOwn
    ? undefined
    : [
        article.authorNames.join(', '),
        ...(article.submission === null
          ? []
          : [
              formatSubmissionFact({
                date: new Date(article.submission.date),
                state: article.submission.state,
              }),
            ]),
        '',
      ].join(' · ')
  const editorSentence = getEditorSentence({
    isOwn,
    isSubmitted: article.submission !== null,
  })

  const selectedAuthorNames = selectedAuthorIds.map(
    (authorId) => authorById.get(authorId)?.name ?? authorId,
  )
  const imageCount = existingImages.length + newImages.length
  const perexLength = [...(fields.perex.value ?? '')].length
  const slugValue = fields.slug.value ?? ''

  return (
    <AdminPage className={styles.page}>
      {/* On a phone a bar that stays on top instead of the header's
          buttons: Zavřít and the save line (24f). */}
      <div className={styles.mobileBar} inert={isDetailOpen}>
        <LinkButton
          onClick={handleClose}
          size={'sm'}
          to={closeHref}
          variant={'ghost'}
        >
          Zavřít
        </LinkButton>
        {renderSaveLine()}
      </div>

      {/* The detail's header (23a): only Zavřít, the editor saves itself
          (24a). */}
      <header className={styles.header} inert={isDetailOpen}>
        <div className={styles.title}>
          <div className={styles.titleLine}>
            <PageTitle>
              {isNewArticle ? 'Nový článek' : 'Úprava článku'}
            </PageTitle>
            <StatusTag state={article.submission?.state ?? 'draft'} />
          </div>
          <div className={styles.headerSaveLine}>
            {renderSaveLine(ownerPrefix)}
          </div>
        </div>
        {/* Sends what waits, then leaves (24e). */}
        <LinkButton
          className={styles.headerClose}
          onClick={handleClose}
          to={closeHref}
          variant={'outline'}
        >
          Zavřít
        </LinkButton>
      </header>

      {editorSentence !== null && (
        <p className={styles.sentence} inert={isDetailOpen}>
          {editorSentence}
        </p>
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

          <AdminDetailLayout>
            <AdminDetailMain>
              <fieldset
                className={styles.lock}
                disabled={isLocked}
                inert={isDetailOpen}
              >
                {/* The title as the detail's heading will set it (kh6gf6k6). */}
                <AdminTextarea
                  field={fields.title}
                  label={'Název'}
                  textareaProps={{
                    className: styles.titleInput,
                    onInput: handleTitleInput,
                    onKeyDown: handleTitleKeyDown,
                    rows: 1,
                  }}
                />
                {/* For search engines and sharing, not shown on the web; the
                    count only advises (24a, mto4s7s7). */}
                <AdminTextarea
                  field={fields.perex}
                  hint={
                    <>
                      <span>
                        Shrnutí pro vyhledávače a náhled při sdílení. Na webu se
                        nezobrazuje. Doporučeno do 160 znaků.
                      </span>
                      <span
                        className={clsx(
                          styles.perexCount,
                          perexLength > PEREX_RECOMMENDED_LENGTH &&
                            styles.perexCountOver,
                        )}
                      >
                        {perexLength} / {PEREX_RECOMMENDED_LENGTH}
                      </span>
                    </>
                  }
                  label={'Perex'}
                  textareaProps={{ className: styles.perexInput }}
                />
                <TextEditor
                  field={fields.content}
                  key={form.key}
                  label={'Text'}
                  readOnly={isReadOnly}
                />
              </fieldset>
            </AdminDetailMain>

            <AdminDetailAside>
              <EditorDetail
                {...detailProps('address')}
                isNameHidden
                name={'Adresa'}
                saveLine={renderSaveLine()}
                summary={slugValue === '' ? '—' : slugValue}
              >
                <fieldset className={styles.lock} disabled={isLocked}>
                  <TextField
                    {...getInputProps(fields.slug, { type: 'text' })}
                    errors={
                      slugSuggestion === null ? undefined : [TAKEN_SLUG_HINT]
                    }
                    hint={
                      isSlugFollowing ? (
                        'Podle názvu, dokud ji nezměníte.'
                      ) : (
                        <>
                          Změněno ručně.{' '}
                          {!isReadOnly && (
                            <ButtonLink onClick={resumeSlug} type={'button'}>
                              Obnovit podle názvu
                            </ButtonLink>
                          )}
                        </>
                      )
                    }
                    label={'Adresa'}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onInput={handleInput}
                  />
                  {/* A taken address: a free one, filled in and saved (24d). */}
                  {slugSuggestion !== null && !isReadOnly && (
                    <ButtonLink
                      onClick={() => {
                        // A chosen address no longer follows the title.
                        handleInput()
                        form.update({
                          name: fields.slug.name,
                          value: slugSuggestion,
                        })
                        // Saved at once (24d), once the field holds it.
                        isFlushOnChangeRef.current = true
                      }}
                      type={'button'}
                    >
                      Použít {slugSuggestion}
                    </ButtonLink>
                  )}
                  {/* The whole address, as the reader will see it (24a). */}
                  {slugValue !== '' && (
                    <span className={styles.path}>/articles/{slugValue}</span>
                  )}
                </fieldset>
              </EditorDetail>

              <EditorDetail
                {...detailProps('authors')}
                name={'Autoři'}
                saveLine={renderSaveLine()}
                summary={
                  selectedAuthorNames.length === 0
                    ? '—'
                    : selectedAuthorNames.join(', ')
                }
              >
                <fieldset className={styles.lock} disabled={isLocked}>
                  <legend className={'screen-reader-only'}>Autoři</legend>
                  <AuthorList ref={authorListRef}>
                    {selectedAuthorIds.map((authorId, index) => {
                      const author = authorById.get(authorId)

                      return (
                        <AuthorListItem
                          image={author?.image ?? NO_IMAGE}
                          isOwn={authorId === ownAuthorId}
                          key={authorId}
                          name={author?.name ?? authorId}
                          onRemove={
                            !isReadOnly && canRemoveAuthor(authorId)
                              ? () => removeAuthor(index)
                              : undefined
                          }
                        />
                      )
                    })}
                  </AuthorList>
                  {selectedAuthorIds.map((authorId, index) => (
                    <input
                      key={authorId}
                      name={`${fields.authorIds.name}[${index}]`}
                      type={'hidden'}
                      value={authorId}
                    />
                  ))}
                  {/* Only the Coordinator may remove their own row, so only
                      they are told why the last one has no × (24j). */}
                  {!isReadOnly &&
                    canChooseAuthorsFreely &&
                    selectedAuthorIds.length === 1 && (
                      <p className={styles.lastAuthorNote}>
                        Nejdřív přidejte jiného autora — článek musí mít aspoň
                        jednoho.
                      </p>
                    )}
                  {/* ChipInput without chips: the authors are the rows
                      above (ivyin4kr). */}
                  {!isReadOnly && (
                    <ChipInput
                      createLabel={
                        isAuthorNameNew
                          ? `Založit autora „${authorQuery.trim()}“`
                          : undefined
                      }
                      disabled={isLocked}
                      emptyLabel={
                        'Žádný autor neodpovídá hledání. Nového autora může založit Administrátor nebo Vlastník.'
                      }
                      id={`${fields.authorIds.id}-search`}
                      isLabelHidden
                      label={authorSearchLabel}
                      onCreate={
                        canCreateAuthor
                          ? () =>
                              navigate(
                                `${href('/administration/authors/add-author')}?${new URLSearchParams(
                                  {
                                    article: params.articleId,
                                    name: authorQuery.trim(),
                                  },
                                )}`,
                              )
                          : undefined
                      }
                      onQueryChange={setAuthorQuery}
                      onSelect={(authorId) =>
                        setSelectedAuthorIds([...selectedAuthorIds, authorId])
                      }
                      options={authorSuggestions}
                      placeholder={authorSearchLabel}
                      query={authorQuery}
                      ref={authorSearchRef}
                    />
                  )}
                </fieldset>
              </EditorDetail>

              <EditorDetail
                {...detailProps('categories')}
                name={'Rubriky'}
                saveLine={renderSaveLine()}
                summary={formatFirstNameAndCount(
                  categoryOptions
                    .filter((category) =>
                      selectedCategoryIds.includes(category.id),
                    )
                    .map((category) => category.name),
                )}
              >
                {/* Ticked, all at once: there are few (24a). One the article
                    has in another state stays under them, greyed, until the
                    editor closes, so unticking it can be undone (iq3nur0e). */}
                <fieldset
                  className={clsx(styles.lock, styles.categories)}
                  disabled={isLocked}
                >
                  <legend className={'screen-reader-only'}>Rubriky</legend>
                  {getCollectionProps(fields.categoryIds, {
                    options: [...publishedCategories, ...otherCategories].map(
                      (category) => category.id,
                    ),
                    type: 'checkbox',
                  }).map(({ key, ...checkboxProps }) => {
                    const category = categoryOptions.find(
                      (option) => option.id === checkboxProps.value,
                    )
                    const isPublished = category?.state === 'published'

                    return (
                      <Checkbox
                        {...checkboxProps}
                        className={clsx(
                          styles.category,
                          !isPublished && styles.categoryOutOfPlay,
                        )}
                        key={key}
                      >
                        {category?.name ?? ''}
                        {category?.state === 'archived' && (
                          <span className={styles.categoryNote}>
                            {' '}
                            archivovaná, na webu se neukáže
                          </span>
                        )}
                      </Checkbox>
                    )
                  })}
                  {removedCategoryIds.map((id) => (
                    <input
                      key={id}
                      name={fields.removedCategoryIds.name}
                      type={'hidden'}
                      value={id}
                    />
                  ))}
                </fieldset>
              </EditorDetail>

              <EditorDetail
                {...detailProps('tags')}
                name={'Štítky'}
                saveLine={renderSaveLine()}
                summary={
                  selectedTagIds.length === 0
                    ? '—'
                    : tagOptions
                        .filter((tag) => selectedTagIds.includes(tag.id))
                        .map((tag) => tag.name)
                        .join(', ')
                }
              >
                {/* Searched, as there are many; an archived one the article
                    has is a dashed chip and never offered again (24a). */}
                <fieldset className={styles.lock} disabled={isLocked}>
                  <ChipInput
                    disabled={isLocked}
                    id={`${fields.tagIds.id}-search`}
                    isLabelHidden
                    label={'Štítky'}
                    onQueryChange={setTagQuery}
                    onRemoveLast={() => setTagIds(selectedTagIds.slice(0, -1))}
                    onSelect={(tagId) => setTagIds([...selectedTagIds, tagId])}
                    options={tagSuggestions}
                    placeholder={'Přidat štítek'}
                    query={tagQuery}
                  >
                    {selectedTagIds.map((tagId) => {
                      const tag = tagOptions.find(
                        (option) => option.id === tagId,
                      )
                      const isArchived = tag?.state === 'archived'

                      return (
                        <Chip
                          key={tagId}
                          muted={tag?.state !== 'published'}
                          note={isArchived ? 'archivovaný' : undefined}
                          onRemove={
                            isReadOnly
                              ? undefined
                              : () =>
                                  setTagIds(
                                    selectedTagIds.filter(
                                      (selectedId) => selectedId !== tagId,
                                    ),
                                  )
                          }
                        >
                          {tag?.name ?? tagId}
                        </Chip>
                      )
                    })}
                  </ChipInput>
                  {selectedTagIds.map((tagId) => (
                    <input
                      key={tagId}
                      name={fields.tagIds.name}
                      type={'hidden'}
                      value={tagId}
                    />
                  ))}
                  {removedTagIds.map((id) => (
                    <input
                      key={id}
                      name={fields.removedTagIds.name}
                      type={'hidden'}
                      value={id}
                    />
                  ))}
                </fieldset>
              </EditorDetail>

              <EditorDetail
                {...detailProps('images')}
                name={'Obrázky'}
                saveLine={renderSaveLine()}
                summary={imageCount === 0 ? '—' : String(imageCount)}
              >
                <fieldset className={styles.lock} disabled={isLocked}>
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
                          {...getInputProps(imageFields.altText, {
                            type: 'text',
                          })}
                          className={styles.imageFieldAltTextContainer}
                          errors={imageFields.altText.errors}
                          label={'Alt text'}
                          placeholder={
                            'Popis obrázku pro vyhledávače a čtečky obrazovky'
                          }
                        />

                        <TextEditor
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
                          {...getInputProps(imageFields.altText, {
                            type: 'text',
                          })}
                          className={styles.imageFieldAltTextContainer}
                          errors={imageFields.altText.errors}
                          label={'Alt text'}
                          placeholder={
                            'Popis obrázku pro vyhledávače a čtečky obrazovky'
                          }
                        />
                        <TextEditor
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

                  {/* A quiet button until the gallery's tile (#673). */}
                  {!isReadOnly && (
                    <Button
                      className={styles.addButton}
                      onClick={() =>
                        form.insert({
                          defaultValue: { id: createId() },
                          name: fields.images.name,
                        })
                      }
                      size={'sm'}
                      type={'button'}
                      variant={'ghost'}
                    >
                      Přidat obrázek
                    </Button>
                  )}
                </fieldset>
              </EditorDetail>
            </AdminDetailAside>
          </AdminDetailLayout>
        </Form>
      </FormProvider>
    </AdminPage>
  )
}
