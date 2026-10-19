// noinspection JSUnusedGlobalSymbols

import {
  FormProvider,
  getCollectionProps,
  getFormProps,
  getInputProps,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import type { ContentState } from '@generated/prisma/enums'
import { clsx } from 'clsx'
import {
  type FocusEvent,
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
import { ActionMenu } from '~/components/action-menu'
import { AdminDetailAside } from '~/components/admin/admin-detail-aside'
import { AdminDetailLayout } from '~/components/admin/admin-detail-layout'
import { AdminDetailMain } from '~/components/admin/admin-detail-main'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { AdminTextarea } from '~/components/admin/admin-textarea'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { ButtonLink } from '~/components/button-link'
import { Callout } from '~/components/callout'
import { CaptionEditor } from '~/components/caption-editor'
import { Checkbox } from '~/components/checkbox'
import { Chip } from '~/components/chip'
import { ChipInput } from '~/components/chip-input'
import { CompactImageTile } from '~/components/compact-image-tile'
import { CompactUploadStatus } from '~/components/compact-upload-status'
import { Form } from '~/components/form'
import { ImageTile } from '~/components/image-tile'
import { ImageTileActions } from '~/components/image-tile-actions'
import { ImageTileAltLine } from '~/components/image-tile-alt-line'
import { ImageTileFile } from '~/components/image-tile-file'
import { ImageTileMedia } from '~/components/image-tile-media'
import { ImageTileMenu } from '~/components/image-tile-menu'
import { ImageTileMessage } from '~/components/image-tile-message'
import { ImageTileOrder } from '~/components/image-tile-order'
import { ImageTilePill } from '~/components/image-tile-pill'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { StatusTag } from '~/components/status-tag'
import { TextEditor } from '~/components/text-editor'
import { TextField } from '~/components/text-field'
import { UploadStatus } from '~/components/upload-status'
import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { FORM_CONFIG } from '~/config/form-config'
import { IMAGE_OVER_PIXEL_BUDGET_MESSAGE } from '~/config/image-variants-config'
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
import { AddImagesTile } from './components/add-images-tile'
import { ArticleChangedDialog } from './components/article-changed-dialog'
import { AuthorList } from './components/author-list'
import { AuthorListItem } from './components/author-list-item'
import { AuthorRemoveButton } from './components/author-remove-button'
import { AuthorRow } from './components/author-row'
import { AuthorRowButton } from './components/author-row-button'
import { CancelUploadDialog } from './components/cancel-upload-dialog'
import { CopyArticleTextButton } from './components/copy-article-text-button'
import { CopyArticleTextHint } from './components/copy-article-text-hint'
import { EditHoldDialog } from './components/edit-hold-dialog'
import { EditorDetail } from './components/editor-detail'
import { GalleryDetail } from './components/gallery-detail'
import { GalleryGrid } from './components/gallery-grid'
import { HoldTakenDialog } from './components/hold-taken-dialog'
import { RemoveImageDialog } from './components/remove-image-dialog'
import { formatArticleChangedDescription } from './utils/format-article-changed-description'
import { formatFirstNameAndCount } from './utils/format-first-name-and-count'
import { formatGallerySummary } from './utils/format-gallery-summary'
import { formatHoldTakenDescription } from './utils/format-hold-taken-description'
import { formatTakeOverDescription } from './utils/format-take-over-description'
import { getEditorSentence } from './utils/get-editor-sentence'
import { getImageMenuItems } from './utils/get-image-menu-items'
import { getReadOnlyNotice } from './utils/get-read-only-notice'
import { getSaveLineText } from './utils/get-save-line-text'
import { isTileUploading } from './utils/is-tile-uploading'
import { useArticleGallery } from './utils/use-article-gallery'
import { useGalleryDrag } from './utils/use-gallery-drag'
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

// Why a category or tag the article has is greyed (24a, iq3nur0e, 8kfn4ou3).
// A draft one is previewed on the web by an author who may view it, so only
// readers do not see it; an archived one nobody sees (copy 86b7n1dq).
const CATEGORY_STATE_NOTE: Partial<Record<ContentState, string>> = {
  archived: 'archivovaná, na webu se neukáže',
  draft: 'v konceptu, čtenáři ji nevidí',
}
const TAG_STATE_NOTE: Partial<Record<ContentState, string>> = {
  archived: 'archivovaný',
  draft: 'v konceptu',
}

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

  const [form, fields] = useForm({
    defaultValue: {
      authorIds: article.authorIds,
      categoryIds: article.categoryIds,
      content: article.content,
      // The gallery's alt texts and captions save with the form; the images
      // save on their own (decision 0027).
      images: article.images.map((image) => ({
        altText: image.altText,
        description: image.description,
        id: image.id,
      })),
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
  const lastSavedAtRef = useRef(article.updatedAt)
  // The form and the gallery save side by side: only a newer save is the
  // last one the hold compares against (24i).
  const acknowledgeSaved = (updatedAt: string) => {
    if (new Date(updatedAt) <= new Date(lastSavedAtRef.current)) return
    lastSavedAtRef.current = updatedAt
    editHold.acknowledgeSave(updatedAt)
    setSavedAt(new Date(updatedAt))
  }
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

    acknowledgeSaved(result.updatedAt)
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
    SNAPSHOT_IGNORED_FIELDS.has(key) ? undefined : value,
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

  // Leaving cancels the uploads under way, so *Zavřít* and a link out ask
  // first while an image uploads (24b, bxy8xxqs). The dialog counts the
  // failures from its opening on (moo05ljj). The gallery keeps both counts
  // here, read ahead of a render.
  const uploadingCountRef = useRef(0)
  const uploadFailureCountRef = useRef(0)
  const [pendingLeave, setPendingLeave] = useState<{
    to: string
    go: () => void
    stay: () => void
    failureCountAtOpen: number
  } | null>(null)
  const askBeforeLeaving = (
    to: string,
    go: () => void,
    stay: () => void = () => {},
  ) =>
    setPendingLeave({
      failureCountAtOpen: uploadFailureCountRef.current,
      go,
      stay,
      to,
    })

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname &&
      (autosave.hasUnsavedChanges() || uploadingCountRef.current > 0),
  )
  const handleBlocked = useEffectEvent(() => {
    if (blocker.state !== 'blocked') return
    const { pathname, search, hash } = blocker.location
    const to = `${pathname}${search}${hash}`
    const settle = () => {
      if (blocker.state === 'blocked') blocker.reset()
    }

    if (uploadingCountRef.current > 0) {
      askBeforeLeaving(to, () => blocker.proceed(), settle)
      return
    }
    void leaveTo(to, () => blocker.proceed()).finally(settle)
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

  const handleClose = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (uploadingCountRef.current > 0) {
      askBeforeLeaving(closeHref, () => navigate(closeHref))
      return
    }
    void leaveTo(closeHref, () => navigate(closeHref))
  }

  // The gallery: every image change saves on its own (24b, decision 0027).
  const imageFieldList = fields.images.getFieldList()
  const readImageField = (index: number, name: string) => {
    const input = formRef.current?.elements.namedItem(
      `${fields.images.name}[${index}].${name}`,
    )
    return input instanceof HTMLInputElement ? input.value : null
  }
  // Read from the form as it stands, ahead of a render.
  const getImageIds = () => {
    const ids: string[] = []
    for (let index = 0; ; index += 1) {
      const id = readImageField(index, 'id')
      if (id === null) return ids
      ids.push(id)
    }
  }
  const gallery = useArticleGallery({
    action: href('/administration/articles/:articleId/images', {
      articleId: params.articleId,
    }),
    featuredImageId: article.featuredImageId,
    images: article.images,
    list: {
      add: (id) =>
        form.insert({
          defaultValue: { altText: '', description: '', id },
          name: fields.images.name,
        }),
      getIds: getImageIds,
      getTexts: (id) => {
        const index = getImageIds().indexOf(id)
        return {
          altText: readImageField(index, 'altText') ?? '',
          description: readImageField(index, 'description') ?? '',
        }
      },
      move: (from, to) => form.reorder({ from, name: fields.images.name, to }),
      remove: (id) => {
        const index = getImageIds().indexOf(id)
        if (index !== -1) form.remove({ index, name: fields.images.name })
      },
    },
    // Refused for the hold: as the whole-form save does (24h, 24i).
    onNotHeld: async (heldByName) => {
      if (heldByName === null) return editHold.retake()
      await editHold.recheck()
      return false
    },
    onSaved: acknowledgeSaved,
    onUploaded: () => autosave.markChanged(),
    tabId: editHold.tabId,
  })
  uploadingCountRef.current = gallery.uploadingCount
  uploadFailureCountRef.current = gallery.uploadFailureCount
  // The dialog's leave cancels what still uploads, and goes once the server
  // has heard of it; once none runs it only closes.
  const leaveDespiteUploads = () => {
    if (pendingLeave === null) return
    const cancelled = gallery.cancelUploads()
    uploadingCountRef.current = 0
    setPendingLeave(null)
    void cancelled
      .then(() => leaveTo(pendingLeave.to, pendingLeave.go))
      .finally(pendingLeave.stay)
  }
  const stayDespiteUploads = () => {
    pendingLeave?.stay()
    setPendingLeave(null)
  }
  // The stored image whose removal waits for its dialog.
  const [removingImageId, setRemovingImageId] = useState<string | null>(null)
  // One file input for *Nahradit soubor* and *Vybrat jiný soubor*.
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const replacingImageIdRef = useRef<string | null>(null)
  const pickReplacement = (id: string) => {
    replacingImageIdRef.current = id
    replaceInputRef.current?.click()
  }
  // After a step from the „⋯“, the focus stays on that tile's „⋯“ and a
  // screen reader hears the new place (8kfn4ou3); a cancel is said too.
  const [galleryAnnouncement, setGalleryAnnouncement] = useState('')
  const [movedImageId, setMovedImageId] = useState<string | null>(null)
  useEffect(() => {
    if (movedImageId === null) return
    formRef.current
      ?.querySelector<HTMLButtonElement>(
        `[data-image-id="${movedImageId}"] [popovertarget]`,
      )
      ?.focus()
    setMovedImageId(null)
  }, [movedImageId])
  // `to` is the place among the stored images, which the „⋯“ and a drag move
  // between. Said once it saved; emptied first, so the same words are said
  // again.
  const moveImage = async (id: string, to: number, count: number) => {
    setGalleryAnnouncement('')
    if (await gallery.move(id, to)) {
      setGalleryAnnouncement(`Pozice ${to + 1}, celkem ${count}.`)
    }
  }
  // A new main image moves to the first place: said like a step, and the
  // focus stays on its „⋯“ (yj2t50dd).
  const featureImage = async (id: string, count: number) => {
    setMovedImageId(id)
    setGalleryAnnouncement('')
    if (await gallery.setFeatured(id)) {
      setGalleryAnnouncement(`Pozice 1, celkem ${count}.`)
    }
  }
  // After a removal the focus goes to the next tile's „⋯“, the previous
  // one's, or *Přidat obrázky*: never lost to the page.
  const [removedImageIndex, setRemovedImageIndex] = useState<number | null>(
    null,
  )
  useEffect(() => {
    if (removedImageIndex === null) return
    const panel = formRef.current?.querySelector('dialog[open]')
    const tiles = [
      ...(panel?.querySelectorAll('li[data-image-id]') ?? []),
    ] as HTMLElement[]
    const target =
      tiles[removedImageIndex] ?? tiles[removedImageIndex - 1] ?? null
    const focusable =
      target?.querySelector<HTMLElement>('[popovertarget], button') ??
      panel?.querySelector<HTMLInputElement>('input[type="file"][multiple]')
    focusable?.focus()
    setRemovedImageIndex(null)
  }, [removedImageIndex])
  const removeImage = async (id: string) => {
    const index = getImageIds().indexOf(id)
    if (await gallery.remove(id)) setRemovedImageIndex(index)
  }
  // A cancelled new image's tile goes: the focus moves to the next tile, after
  // the last one to *Přidat obrázky*. A cancelled replacement stays, so the
  // focus goes to its „⋯“. Said either way (24b, bxy8xxqs).
  const [cancelledImageIndex, setCancelledImageIndex] = useState<number | null>(
    null,
  )
  useEffect(() => {
    if (cancelledImageIndex === null) return
    const panel = formRef.current?.querySelector('dialog[open]')
    const target =
      panel?.querySelectorAll('li[data-image-id]')[cancelledImageIndex]
    const focusable =
      target?.querySelector<HTMLElement>('[popovertarget], button') ??
      panel?.querySelector<HTMLInputElement>('input[type="file"][multiple]')
    focusable?.focus()
    setCancelledImageIndex(null)
  }, [cancelledImageIndex])
  const cancelImageUpload = (id: string) => {
    const index = getImageIds().indexOf(id)
    const isReplacement = gallery.tiles.get(id)?.replaced != null
    if (!gallery.cancelUpload(id)) return
    if (isReplacement) {
      setMovedImageId(id)
    } else {
      setCancelledImageIndex(index)
    }
    // Emptied first, so the same words are said again.
    setGalleryAnnouncement('')
    setTimeout(() => setGalleryAnnouncement('Nahrávání zrušeno.'), 100)
  }
  // Wherever a pick starts, it ends in the panel, in the first new image's
  // alt text (sa1x34z3). A pick that made no tile opens nothing.
  const [newImageFocusId, setNewImageFocusId] = useState<string | null>(null)
  const addImages = (files: File[]) => {
    const [firstAddedId] = gallery.addFiles(files)
    if (firstAddedId === undefined) return
    setOpenDetail('images')
    setNewImageFocusId(firstAddedId)
  }
  // Runs after the panel's own focus on its name, once the tile is there.
  useEffect(() => {
    if (newImageFocusId === null) return
    const altInput = formRef.current?.querySelector<HTMLInputElement>(
      `[data-image-id="${newImageFocusId}"] input[name$=".altText"]`,
    )
    if (altInput == null) return
    altInput.scrollIntoView({ block: 'center' })
    altInput.focus()
    setNewImageFocusId(null)
  })

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

  // The categories and tags as the editor opened: one in another state stays
  // in the list after it is unticked, so a mistake can be undone (24a).
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

  // Tags by search, the ones not picked yet. Besides the published ones,
  // a tag the article had at open in another state stays on offer under them
  // until the editor closes, so removing it can be undone (8kfn4ou3).
  const [tagQuery, setTagQuery] = useState('')
  const foldedTagQuery = foldForSearch(tagQuery.trim())
  const tagSuggestions = tagOptions
    .filter(
      (tag) =>
        !selectedTagIds.includes(tag.id) &&
        foldForSearch(tag.name).includes(foldedTagQuery),
    )
    .sort(
      (first, second) =>
        Number(first.state !== 'published') -
        Number(second.state !== 'published'),
    )
    .map((tag) => ({
      label: tag.name,
      note: TAG_STATE_NOTE[tag.state],
      value: tag.id,
    }))
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
  // The authors a search offers: not chosen yet, the association only to the
  // Coordinator (decision 0026).
  const getAuthorSuggestions = (query: string) =>
    loaderData.authors
      .filter(
        (author) =>
          !selectedAuthorIds.includes(author.id) &&
          (canChooseAuthorsFreely || !author.isAssociation) &&
          foldForSearch(author.name).includes(foldForSearch(query.trim())),
      )
      .map((author) => ({
        avatar: author.image,
        label: author.name,
        note: author.roleLabel ?? undefined,
        value: author.id,
      }))
  // *Založit autora* stays the last option, under matches too, until the
  // typed name is exactly an author's (ivyin4kr).
  const getCreateAuthorLabel = (query: string) =>
    loaderData.authors.some(
      (author) => foldForSearch(author.name) === foldForSearch(query.trim()),
    )
      ? undefined
      : `Založit autora „${query.trim()}“`
  // Back from the new author's page, they are added, or replace the author
  // the replacement started from (24j, 28c).
  const createAuthor = canCreateAuthor
    ? (query: string, replacedAuthorId?: string) =>
        navigate(
          `${href('/administration/authors/add-author')}?${new URLSearchParams({
            article: params.articleId,
            name: query.trim(),
            ...(replacedAuthorId === undefined
              ? {}
              : { replace: replacedAuthorId }),
          })}`,
        )
    : undefined
  const noAuthorFound =
    'Žádný autor neodpovídá hledání. Nového autora může založit Administrátor nebo Vlastník.'

  const [authorQuery, setAuthorQuery] = useState('')
  // The last author stays: an article always has one (24j).
  const canRemoveAuthor = (authorId: string) =>
    selectedAuthorIds.length > 1 &&
    (canChooseAuthorsFreely || authorId !== ownAuthorId)
  // In its place the only author can be replaced, by whoever may leave
  // themselves out (ivyin4kr).
  const canReplaceAuthor =
    selectedAuthorIds.length === 1 && canChooseAuthorsFreely
  const authorListRef = useRef<HTMLUListElement>(null)
  const authorSearchRef = useRef<HTMLInputElement>(null)
  // After a change the focus goes to that row's button (the next row's
  // after a removal), or to the search.
  const authorFocusIndexRef = useRef<number | null>(null)
  // The row's button, else the previous row's (after removing the last one);
  // the search only when no row has one.
  const focusAuthorRow = (index: number) => {
    const rowButton = (at: number) =>
      authorListRef.current?.children.item(at)?.querySelector('button')
    ;(
      rowButton(index) ??
      rowButton(index - 1) ??
      authorSearchRef.current
    )?.focus()
  }
  const removeAuthor = (index: number) => {
    authorFocusIndexRef.current = index
    setSelectedAuthorIds(selectedAuthorIds.filter((_, at) => at !== index))
  }

  // Replacing: the row gets the Vybrat jiného autora field, Přidat autora steps aside
  // (ivyin4kr). The pick replaces the author in one save.
  const [replacingAuthorId, setReplacingAuthorId] = useState<string | null>(
    null,
  )
  const [replaceQuery, setReplaceQuery] = useState('')
  const replaceSearchRef = useRef<HTMLInputElement>(null)
  const startReplacing = (authorId: string) => {
    setReplaceQuery('')
    setReplacingAuthorId(authorId)
  }
  // Zrušit and Esc return the focus to Vyměnit; leaving the frame (a click or
  // Tab elsewhere) keeps it where it went.
  const cancelFocusIndexRef = useRef<number | null>(null)
  const cancelReplacing = (
    index: number,
    { refocus }: { refocus: boolean },
  ) => {
    cancelFocusIndexRef.current = refocus ? index : null
    setReplacingAuthorId(null)
  }
  // Esc cancels at once, the open list included, and goes no further: on a
  // phone it would also close the Autoři panel (24f).
  const handleReplaceKeyDown =
    (index: number) => (event: ReactKeyboardEvent<HTMLLIElement>) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      cancelReplacing(index, { refocus: true })
    }
  const handleReplaceBlur =
    (index: number) => (event: FocusEvent<HTMLLIElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        cancelReplacing(index, { refocus: false })
      }
    }
  // A press anywhere in the frame but the field keeps the focus in the field:
  // a click that does not focus (Zrušit in Safari, the name) is no leaving.
  const handleReplaceMouseDown = (event: MouseEvent<HTMLLIElement>) => {
    if (!(event.target instanceof Element && event.target.closest('input'))) {
      event.preventDefault()
    }
  }
  const replaceAuthor = (replacedAuthorId: string, authorId: string) => {
    authorFocusIndexRef.current = selectedAuthorIds.indexOf(replacedAuthorId)
    setReplacingAuthorId(null)
    setSelectedAuthorIds(
      selectedAuthorIds.map((id) => (id === replacedAuthorId ? authorId : id)),
    )
  }
  // After the commit: into the field when replacing starts, back to Vyměnit
  // when Zrušit or Esc ended it.
  const handleReplacingChange = useEffectEvent((isReplacing: boolean) => {
    if (isReplacing) {
      replaceSearchRef.current?.focus()
      return
    }
    const index = cancelFocusIndexRef.current
    if (index === null) return
    cancelFocusIndexRef.current = null
    focusAuthorRow(index)
  })
  useEffect(() => {
    handleReplacingChange(replacingAuthorId !== null)
  }, [replacingAuthorId])

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
    focusAuthorRow(focusIndex)
  })
  useEffect(() => {
    if (authorIdsKey === authorIdsKeyRef.current) return
    authorIdsKeyRef.current = authorIdsKey
    handleAuthorsChange()
  }, [authorIdsKey])

  // Back from *Založit autora*, the new author is chosen (24j, 28c), in place
  // of the replaced one if the replacement started it, once the hold allows a
  // save. It comes once, from the page load (a one-time cookie), so neither a
  // revalidation nor a link adds it.
  const [createdAuthor] = useState(loaderData.createdAuthor)
  const hasAddedCreatedAuthorRef = useRef(false)
  const addCreatedAuthor = useEffectEvent(() => {
    if (hasAddedCreatedAuthorRef.current || createdAuthor === null) return
    hasAddedCreatedAuthorRef.current = true

    const { authorId, replacedAuthorId } = createdAuthor
    if (!authorById.has(authorId) || selectedAuthorIds.includes(authorId)) {
      return
    }
    setSelectedAuthorIds(
      replacedAuthorId !== null && selectedAuthorIds.includes(replacedAuthorId)
        ? selectedAuthorIds.map((id) =>
            id === replacedAuthorId ? authorId : id,
          )
        : [...selectedAuthorIds, authorId],
    )
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
    !fields.title.value && !fields.content.value && imageFieldList.length === 0

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
  const imageIds = imageFieldList.map(
    (image) => image.getFieldset().id.value ?? '',
  )
  // The images saved already, in the gallery's order; only they move.
  const storedImageIds = imageIds.filter(
    (id) => gallery.tiles.get(id)?.status === 'stored',
  )
  // A tile with its „⋯“ is dragged by its preview too (24b); a drop moves
  // and says the place as the „⋯“ does, the focus stays where it is. The
  // main image stands first and stays there (yj2t50dd).
  const isFeaturedImage = (id: string) => gallery.featuredImageId === id
  const canDragImage = (id: string) => {
    const tile = gallery.tiles.get(id)
    return (
      !isLocked &&
      !isReadOnly &&
      !isFeaturedImage(id) &&
      tile?.status === 'stored' &&
      !isTileUploading(tile) &&
      !tile.isRemoving
    )
  }
  const galleryDrag = useGalleryDrag({
    canDrag: canDragImage,
    handleSelector: `.${styles.imageHandle}`,
    ids: imageIds,
    isPinned: isFeaturedImage,
    onDrop: (id, to) => void moveImage(id, to, storedImageIds.length),
    storedIds: storedImageIds,
  })
  // A stored image's number is its place on the web, renumbered while a tile
  // is dragged; the „⋯“'s name says the same number (yj2t50dd).
  const shownStoredImageIds = galleryDrag.shownIds.filter((id) =>
    storedImageIds.includes(id),
  )
  const getImageNumber = (id: string) => shownStoredImageIds.indexOf(id) + 1
  const gallerySummary = formatGallerySummary(
    imageFieldList.length,
    gallery.uploadingCount,
  )
  // The phone's row shows the first three stored images (u94oosdp).
  const galleryThumbnails = shownStoredImageIds
    .map((id) => gallery.tiles.get(id)?.previewUrl)
    .filter((source) => typeof source === 'string')
    .slice(0, 3)
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

      {pendingLeave !== null && (
        <CancelUploadDialog
          failedCount={
            gallery.uploadFailureCount - pendingLeave.failureCountAtOpen
          }
          onLeave={leaveDespiteUploads}
          onStay={stayDespiteUploads}
          replacingCount={gallery.replacingCount}
          uploadingCount={gallery.uploadingCount}
        />
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
                      const name = author?.name ?? authorId
                      // Without the hold nothing is replaced (07g).
                      const isReplacing =
                        replacingAuthorId === authorId && !isReadOnly

                      return (
                        <AuthorListItem
                          isReplacing={isReplacing}
                          key={authorId}
                          onBlur={
                            isReplacing ? handleReplaceBlur(index) : undefined
                          }
                          onKeyDownCapture={
                            isReplacing
                              ? handleReplaceKeyDown(index)
                              : undefined
                          }
                          onMouseDown={
                            isReplacing ? handleReplaceMouseDown : undefined
                          }
                        >
                          {/* At most one action, each its own node, so a
                              click meant for one never lands on another. */}
                          <AuthorRow
                            image={author?.image ?? NO_IMAGE}
                            isOwn={authorId === ownAuthorId}
                            name={name}
                          >
                            {isReplacing ? (
                              <AuthorRowButton
                                aria-label={'Zrušit výměnu autora'}
                                key={'cancel'}
                                onClick={() =>
                                  cancelReplacing(index, { refocus: true })
                                }
                              >
                                Zrušit
                              </AuthorRowButton>
                            ) : isReadOnly ? null : canRemoveAuthor(
                                authorId,
                              ) ? (
                              <AuthorRemoveButton
                                key={'remove'}
                                name={name}
                                onClick={() => removeAuthor(index)}
                              />
                            ) : canReplaceAuthor ? (
                              <AuthorRowButton
                                aria-label={`Vyměnit autora: ${name}`}
                                key={'replace'}
                                onClick={() => startReplacing(authorId)}
                              >
                                Vyměnit
                              </AuthorRowButton>
                            ) : null}
                          </AuthorRow>
                          {isReplacing && (
                            <ChipInput
                              createLabel={getCreateAuthorLabel(replaceQuery)}
                              createNote={
                                'Po uložení nahradí současného autora.'
                              }
                              disabled={isLocked}
                              emptyLabel={noAuthorFound}
                              id={`${fields.authorIds.id}-replace`}
                              isLabelHidden
                              label={`Vybrat jiného autora. Nyní: ${name}`}
                              onCreate={
                                createAuthor === undefined
                                  ? undefined
                                  : () => createAuthor(replaceQuery, authorId)
                              }
                              onQueryChange={setReplaceQuery}
                              onSelect={(newAuthorId) =>
                                replaceAuthor(authorId, newAuthorId)
                              }
                              options={getAuthorSuggestions(replaceQuery)}
                              placeholder={'Vybrat jiného autora'}
                              query={replaceQuery}
                              ref={replaceSearchRef}
                            />
                          )}
                        </AuthorListItem>
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
                  {/* ChipInput without chips: the authors are the rows
                      above. One label for every role, as it only adds; it
                      steps aside while a row is replaced (ivyin4kr). */}
                  {!isReadOnly && replacingAuthorId === null && (
                    <ChipInput
                      createLabel={getCreateAuthorLabel(authorQuery)}
                      disabled={isLocked}
                      emptyLabel={noAuthorFound}
                      id={`${fields.authorIds.id}-search`}
                      isLabelHidden
                      label={'Přidat autora'}
                      onCreate={
                        createAuthor === undefined
                          ? undefined
                          : () => createAuthor(authorQuery)
                      }
                      onQueryChange={setAuthorQuery}
                      onSelect={(authorId) =>
                        setSelectedAuthorIds([...selectedAuthorIds, authorId])
                      }
                      options={getAuthorSuggestions(authorQuery)}
                      placeholder={'Přidat autora'}
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
                        {category !== undefined &&
                          CATEGORY_STATE_NOTE[category.state] !== undefined && (
                            <span className={styles.categoryNote}>
                              {' '}
                              {CATEGORY_STATE_NOTE[category.state]}
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
                {/* Searched, as there are many; one the article has in
                    another state is a dashed chip with its word (24a). */}
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

                      return (
                        <Chip
                          key={tagId}
                          muted={tag?.state !== 'published'}
                          note={
                            tag === undefined
                              ? undefined
                              : TAG_STATE_NOTE[tag.state]
                          }
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

              <GalleryDetail
                {...detailProps('images')}
                preview={
                  <>
                    <GalleryGrid columns={2}>
                      {imageFieldList.map((image) => {
                        const imageFields = image.getFieldset()
                        const id = imageFields.id.value ?? ''
                        const tile = gallery.tiles.get(id)
                        const altText = imageFields.altText.value ?? ''
                        const isFailed = tile?.status === 'failed'
                        const isUploading =
                          tile !== undefined && isTileUploading(tile)

                        return (
                          <li key={image.key}>
                            <CompactImageTile>
                              <ImageTileMedia
                                isFailed={isFailed}
                                isUploading={isUploading}
                                source={tile?.previewUrl}
                              >
                                {/* While it uploads, no number and no pill
                                    (bxy8xxqs). */}
                                {tile?.status === 'stored' && !isUploading && (
                                  <ImageTileOrder number={getImageNumber(id)} />
                                )}
                                {gallery.featuredImageId === id &&
                                  !isUploading && (
                                    <ImageTilePill>Hlavní</ImageTilePill>
                                  )}
                              </ImageTileMedia>
                              {isFailed ? (
                                <ImageTileAltLine isFailed>
                                  Zpracování selhalo
                                </ImageTileAltLine>
                              ) : isUploading ? (
                                <CompactUploadStatus />
                              ) : altText === '' ? (
                                <ImageTileAltLine isMissing>
                                  Bez alt textu
                                </ImageTileAltLine>
                              ) : (
                                <ImageTileAltLine>{altText}</ImageTileAltLine>
                              )}
                            </CompactImageTile>
                          </li>
                        )
                      })}
                      {!isReadOnly && (
                        <AddImagesTile
                          disabled={isLocked}
                          isCompact
                          onFiles={addImages}
                        />
                      )}
                    </GalleryGrid>
                    {/* A pick that made no tile opens nothing (sa1x34z3). */}
                    {gallery.rejectedSentences.map((sentence, index) => (
                      <p className={styles.galleryError} key={index}>
                        {sentence}
                      </p>
                    ))}
                  </>
                }
                // A change that did not save says so where saving is said, in
                // sight wherever the author is in the gallery (in5bl1cq).
                saveLine={
                  gallery.hasFailedChange && lostHold === null ? (
                    <p className={styles.saveLine} role={'alert'}>
                      <span className={styles.saveFailure}>
                        Proveďte změnu znovu — nepodařilo se ji uložit.
                      </span>
                    </p>
                  ) : (
                    renderSaveLine()
                  )
                }
                summary={gallerySummary}
                thumbnails={galleryThumbnails}
              >
                <fieldset
                  className={clsx(styles.lock, styles.gallery)}
                  disabled={isLocked}
                >
                  <legend className={'screen-reader-only'}>Obrázky</legend>
                  {imageFieldList.length > 0 && (
                    <p className={styles.gallerySummary}>{gallerySummary}</p>
                  )}
                  <GalleryGrid columns={3}>
                    {imageFieldList.map((image) => {
                      const imageFields = image.getFieldset()
                      const id = imageFields.id.value ?? ''
                      const tile = gallery.tiles.get(id)
                      const isStored = tile?.status === 'stored'
                      const isUploading =
                        tile !== undefined && isTileUploading(tile)
                      const idInput = (
                        <input
                          {...getInputProps(imageFields.id, {
                            type: 'hidden',
                          })}
                          key={imageFields.id.key}
                        />
                      )

                      // Only in the open editor; removed without a dialog,
                      // there is nothing to lose (24b).
                      if (tile?.status === 'failed') {
                        return (
                          <li
                            data-image-id={id}
                            key={image.key}
                            {...galleryDrag.getTileProps(id)}
                            style={{ order: galleryDrag.getOrder(id) }}
                          >
                            {idInput}
                            <ImageTile>
                              <ImageTileMedia isFailed />
                              <ImageTileMessage>
                                {tile.isOverPixelBudget
                                  ? IMAGE_OVER_PIXEL_BUDGET_MESSAGE
                                  : 'Vyberte jiný soubor nebo obrázek odeberte — zpracování se nepodařilo.'}
                              </ImageTileMessage>
                              {!isReadOnly && (
                                <ImageTileActions>
                                  <ButtonLink
                                    onClick={() => pickReplacement(id)}
                                  >
                                    Vybrat jiný soubor
                                  </ButtonLink>
                                  <ButtonLink
                                    onClick={() => void removeImage(id)}
                                  >
                                    Odebrat
                                  </ButtonLink>
                                </ImageTileActions>
                              )}
                              {tile.fileName !== null && (
                                <ImageTileFile>{tile.fileName}</ImageTileFile>
                              )}
                            </ImageTile>
                          </li>
                        )
                      }

                      const isFeatured = gallery.featuredImageId === id
                      const isLifted = galleryDrag.draggedId === id

                      return (
                        <li
                          className={clsx(
                            tile?.isRemoving && styles.removingImage,
                            isLifted && styles.imageLanding,
                          )}
                          data-image-id={id}
                          key={image.key}
                          {...galleryDrag.getTileProps(id)}
                          style={{ order: galleryDrag.getOrder(id) }}
                        >
                          {idInput}
                          <ImageTile
                            className={clsx(isLifted && styles.liftedImage)}
                            isLifted={isLifted}
                          >
                            <ImageTileMedia
                              className={clsx(
                                canDragImage(id) &&
                                  !isLifted &&
                                  styles.imageHandle,
                              )}
                              isUploading={isUploading}
                              source={tile?.previewUrl}
                            >
                              {/* While it uploads, a replacement too, the tile
                                  has no number, pill or „⋯“ (bxy8xxqs). */}
                              {isStored && !isUploading && (
                                <ImageTileOrder
                                  hasGrip={canDragImage(id)}
                                  number={getImageNumber(id)}
                                />
                              )}
                              {isFeatured && !isUploading && (
                                <ImageTilePill>Hlavní</ImageTilePill>
                              )}
                              {isStored &&
                                !isUploading &&
                                !tile?.isRemoving &&
                                !isReadOnly && (
                                  <ImageTileMenu>
                                    <ActionMenu
                                      items={getImageMenuItems({
                                        count: storedImageIds.length,
                                        hasFeatured:
                                          gallery.featuredImageId !== null,
                                        index: storedImageIds.indexOf(id),
                                        isFeatured,
                                        onFeature: () =>
                                          void featureImage(
                                            id,
                                            storedImageIds.length,
                                          ),
                                        onMove: (to) => {
                                          setMovedImageId(id)
                                          void moveImage(
                                            id,
                                            to,
                                            storedImageIds.length,
                                          )
                                        },
                                        onRemove: () => setRemovingImageId(id),
                                        onReplace: () => pickReplacement(id),
                                        onUnfeature: () =>
                                          void gallery.setFeatured(null),
                                      })}
                                      // The tile has no name of its own: its
                                      // number tells it apart (copy hu5a658a,
                                      // yj2t50dd).
                                      label={`Další akce obrázku ${getImageNumber(id)}`}
                                      variant={'chip'}
                                    />
                                  </ImageTileMenu>
                                )}
                            </ImageTileMedia>
                            {/* Zrušit takes the place of Odebrat while the
                                file is on its way (bxy8xxqs). */}
                            {isUploading && (
                              <UploadStatus
                                cancelLabel={
                                  tile.fileName === null
                                    ? 'Zrušit nahrávání'
                                    : `Zrušit nahrávání ${tile.fileName}`
                                }
                                onCancel={() => cancelImageUpload(id)}
                              />
                            )}
                            {tile?.hasReplaceFailed && (
                              <>
                                <ImageTileMessage>
                                  {tile.isOverPixelBudget
                                    ? IMAGE_OVER_PIXEL_BUDGET_MESSAGE
                                    : 'Nový soubor se nepodařilo zpracovat.'}{' '}
                                  Původní obrázek zůstává.
                                </ImageTileMessage>
                                {!isReadOnly && (
                                  <ImageTileActions>
                                    <ButtonLink
                                      onClick={() => pickReplacement(id)}
                                    >
                                      Vybrat jiný soubor
                                    </ButtonLink>
                                  </ImageTileActions>
                                )}
                              </>
                            )}
                            <TextField
                              {...getInputProps(imageFields.altText, {
                                type: 'text',
                              })}
                              hint={
                                'Popis obrázku pro čtečky obrazovky a vyhledávače.'
                              }
                              isHintOnFocus
                              label={'Alt text'}
                              placeholder={'Co je na obrázku'}
                              size={'sm'}
                            />
                            <CaptionEditor
                              field={imageFields.description}
                              inputProps={{
                                placeholder: 'Pod obrázkem na webu',
                              }}
                              label={'Popisek'}
                              readOnly={isReadOnly}
                            />
                            {tile?.fileName != null && (
                              <ImageTileFile>{tile.fileName}</ImageTileFile>
                            )}
                          </ImageTile>
                        </li>
                      )
                    })}
                    {!isReadOnly && (
                      <AddImagesTile disabled={isLocked} onFiles={addImages} />
                    )}
                  </GalleryGrid>
                  {gallery.rejectedSentences.map((sentence, index) => (
                    <p className={styles.galleryError} key={index}>
                      {sentence}
                    </p>
                  ))}

                  <input
                    accept={'image/*'}
                    className={styles.replaceInput}
                    form={''}
                    onChange={(event) => {
                      const [file] = event.currentTarget.files ?? []
                      const id = replacingImageIdRef.current
                      event.currentTarget.value = ''
                      if (file !== undefined && id !== null) {
                        gallery.replaceFile(id, file)
                      }
                    }}
                    ref={replaceInputRef}
                    tabIndex={-1}
                    type={'file'}
                  />
                  <span aria-live={'polite'} className={'screen-reader-only'}>
                    {galleryAnnouncement}
                  </span>
                </fieldset>
                {removingImageId !== null && (
                  <RemoveImageDialog
                    isFeatured={gallery.featuredImageId === removingImageId}
                    onCancel={() => setRemovingImageId(null)}
                    onConfirm={() => {
                      void removeImage(removingImageId)
                      setRemovingImageId(null)
                    }}
                  />
                )}
              </GalleryDetail>
              {/* Refused files are said too, outside the panel: a pick from
                  the column that made no tile opens nothing (sa1x34z3). */}
              <span aria-live={'polite'} className={'screen-reader-only'}>
                {gallery.rejectedSentences.join(' ')}
              </span>
            </AdminDetailAside>
          </AdminDetailLayout>
        </Form>
      </FormProvider>
    </AdminPage>
  )
}
