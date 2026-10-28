// noinspection JSUnusedGlobalSymbols

import {
  FormProvider,
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { clsx } from 'clsx'
import {
  type MouseEvent,
  type SubmitEvent,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from 'react'
import { href, useBlocker, useNavigate, useRevalidator } from 'react-router'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { AdminTextarea } from '~/components/admin/admin-textarea'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { ButtonLink } from '~/components/button-link'
import { Callout } from '~/components/callout'
import { CancelUploadDialog } from '~/components/cancel-upload-dialog'
import { ContentChangedDialog } from '~/components/content-changed-dialog'
import { ContentDeletedDialog } from '~/components/content-deleted-dialog'
import { EditHoldDialog } from '~/components/edit-hold-dialog'
import { ErrorMessage } from '~/components/error-message'
import { FailedFile } from '~/components/failed-file'
import { FileDropField } from '~/components/file-drop-field'
import { Form } from '~/components/form'
import { HoldTakenDialog } from '~/components/hold-taken-dialog'
import { Image } from '~/components/image'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { Select } from '~/components/select'
import { StatusTag } from '~/components/status-tag'
import { TextField } from '~/components/text-field'
import { UploadStatus } from '~/components/upload-status'
import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { FORM_CONFIG } from '~/config/form-config'
import { type AutosaveSendResult, useAutosave } from '~/hooks/use-autosave'
import { useCoverUpload } from '~/hooks/use-cover-upload'
import { useEditHold } from '~/hooks/use-edit-hold'
import { useTakenValues } from '~/hooks/use-taken-values'
import { formatEditHoldLine } from '~/routes/administration/articles/utils/format-edit-hold-line'
import { isSaveShortcut } from '~/utils/autosave/is-save-shortcut'
import { formatTakeOverDescription } from '~/utils/edit-hold/format-take-over-description'
import { getReadOnlyNotice } from '~/utils/edit-hold/get-read-only-notice'
import {
  CANCEL_COVER_UPLOAD_LABEL,
  COVER_CANCEL_CROSSED_ANNOUNCEMENT,
  COVER_FAILED_SENTENCE,
  COVER_UPLOAD_CANCELLED_ANNOUNCEMENT,
  COVER_UPLOAD_DONE_SENTENCE,
  COVER_UPLOADING_SENTENCE,
  ORIGINAL_COVER_STAYED_SENTENCE,
  ORIGINAL_COVER_STAYS_SENTENCE,
} from '~/utils/podcast/cover-upload-sentences'
import { getPodcastDisplayTitle } from '~/utils/podcast/get-podcast-display-title'
import { slugify } from '~/utils/slugify'
import { useAutoSlug } from '~/utils/use-auto-slug'

import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { createEditorSchema } from './utils/create-editor-schema'
import { formatPodcastChangedDescription } from './utils/format-podcast-changed-description'
import { formatPodcastHoldTakenDescription } from './utils/format-podcast-hold-taken-description'
import {
  COVER_LABEL,
  formatUnsavedPodcastAdvice,
} from './utils/format-unsaved-podcast-advice'
import { getPodcastEditorSentence } from './utils/get-podcast-editor-sentence'
import { getPodcastSaveLineText } from './utils/get-podcast-save-line-text'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

// What the save route answers (log 0022).
type SaveResponse =
  | {
      status: 'saved'
      updatedAt: string
      takenSlug: string | null
      slugSuggestion: string | null
    }
  | { status: 'not-held'; heldByName: string | null }

// The name of the button Conform submits its intents with.
const CONFORM_INTENT_NAME = '__intent__'

// The tab's own fields are no change of the podcast.
const SNAPSHOT_IGNORED_FIELDS = new Set<string>([
  FORM_CONFIG.authenticityToken.name,
  EDIT_HOLD_CONFIG.tabIdName,
])

// The labels a list of unsent fields uses (copy utgh1hb7).
const FIELD_LABELS = {
  authorId: 'Autor',
  description: 'Popis',
  slug: 'Adresa',
  title: 'Název',
} as const

type FieldName = keyof typeof FIELD_LABELS
type FieldValues = Record<FieldName, string>

// The fields in the form's order, as a list of unsent ones names them.
const FIELD_ORDER: FieldName[] = ['title', 'slug', 'description', 'authorId']

// What the editor says once the hold went elsewhere (24h, 24i): which dialog,
// and which fields stayed unsent.
type HoldLoss = {
  dialog: 'taken' | 'changed' | null
  holderName: string
  unsentLabels: string[]
}

// A field's value in the form, read as the input holds it.
const readValues = (formData: FormData | null): Partial<FieldValues> => {
  if (formData === null) return {}
  const values: Partial<FieldValues> = {}
  for (const [key, value] of formData) {
    if (typeof value === 'string' && key in FIELD_LABELS) {
      values[key as FieldName] = value.trim()
    }
  }
  return values
}

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { authors, isApprover, isOwn, podcast } = loaderData
  const { podcastId } = params
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  // The name the breadcrumb and the tab show, as last loaded.
  const loadedTitle = podcast.isEmptyDraft
    ? null
    : getPodcastDisplayTitle(podcast.title)
  const loadedTitleRef = useRef(loadedTitle)
  loadedTitleRef.current = loadedTitle
  const formRef = useRef<HTMLFormElement>(null)
  const saveAction = href('/administration/podcasts/:podcastId/save', {
    podcastId,
  })

  // Autosave is set up after the hold; a closing page asks it through this.
  const leaveSaveRef = useRef<() => FormData | null>(() => null)
  // The cover upload is set up after the hold too; the hold reads this.
  const [isCoverUploading, setIsCoverUploading] = useState(false)

  // One tab edits at a time (07g, 24g).
  const editHold = useEditHold({
    action: href('/administration/podcasts/:podcastId/edit-hold', {
      podcastId,
    }),
    entity: 'podcast',
    id: podcastId,
    // A first cover on its way is content: the release must not delete the
    // draft under it.
    isEmpty: podcast.isEmptyDraft && !isCoverUploading,
    leaveSave: {
      action: saveAction,
      getFormData: () => leaveSaveRef.current(),
    },
    updatedAt: podcast.updatedAt,
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
  // The podcast is gone for good (24k, log 0036).
  const isDeleted = editHold.state.status === 'deleted'
  const readOnlyNotice = getReadOnlyNotice(editHold.state, 'podcast')
  // Changed meanwhile, and free to edit again here (24i).
  const canReloadChanged =
    editHold.state.status === 'changed' &&
    editHold.state.holder === null &&
    editHold.state.isEditable
  const [holdLoss, setHoldLoss] = useState<HoldLoss | null>(null)

  const listHref = href('/administration/podcasts')
  // An empty draft has no page (0020); deleted, the page is gone too.
  const closeHref =
    podcast.isEmptyDraft || isDeleted
      ? listHref
      : href('/administration/podcasts/:podcastId', { podcastId })

  const loadedValues: FieldValues = {
    authorId: podcast.authorId,
    description: podcast.description,
    slug: podcast.slug,
    title: podcast.title,
  }

  // A locked fieldset leaves the form's data, so the heading, the preview and
  // the list of unsent fields keep the values the editor last showed (07g).
  const shownValuesRef = useRef(loadedValues)

  // Addresses another podcast holds as published (27e, log 0039); the schema
  // turns them into the field's error.
  const takenSlugs = useTakenValues([podcast.takenSlug])

  const [form, fields] = useForm({
    defaultValue: loadedValues,
    id: 'edit-podcast',
    // Parsed here, so a taken address is said at its field; it saves (27e).
    onValidate: ({ formData }) =>
      parseWithZod(formData, {
        schema: createEditorSchema({ isSlugTaken: takenSlugs.has }),
      }),
    shouldRevalidate: 'onInput',
    shouldValidate: 'onBlur',
  })

  // A taken address when the page loads, the field says once the editor holds
  // the edit: a locked fieldset leaves its fields out of the form (27e).
  const validateLoaded = useEffectEvent(() => {
    if (podcast.takenSlug !== null) form.validate()
  })
  useEffect(() => {
    if (isHolding) validateLoaded()
  }, [isHolding])

  // The podcast's last save, as the line under the heading says it (24e). A
  // new draft has none until its first save.
  const [savedAt, setSavedAt] = useState(() =>
    podcast.isEmptyDraft ? null : new Date(podcast.updatedAt),
  )
  const lastSavedAtRef = useRef(podcast.updatedAt)
  // This editor's own saves: the dialogs of 24h and 24i speak of them.
  const [hasSaved, setHasSaved] = useState(false)
  const savedValuesRef = useRef<Partial<FieldValues>>(loadedValues)
  const acknowledgeSaved = (updatedAt: string) => {
    if (new Date(updatedAt) <= new Date(lastSavedAtRef.current)) return
    lastSavedAtRef.current = updatedAt
    editHold.acknowledgeSave(updatedAt)
    setSavedAt(new Date(updatedAt))
    setHasSaved(true)
  }

  // A free address to offer for a taken one (27e, 2whigbz5).
  const [slugSuggestion, setSlugSuggestion] = useState(podcast.slugSuggestion)

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

    // Deleted meanwhile (0036): the hold learns it and the editor only reads.
    if (response.status === 410) {
      await editHold.recheck()
      return 'failed'
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
    // so it is taken back if nothing was saved since, and the save goes again
    // (24i); or someone does, and the editor learns who (24h).
    if (result.status === 'not-held') {
      if (result.heldByName === null) {
        if (!isRetry && (await editHold.retake())) return send(formData, true)
      } else {
        await editHold.recheck()
      }
      return 'failed'
    }

    savedValuesRef.current = readValues(formData)
    acknowledgeSaved(result.updatedAt)
    setSlugSuggestion(result.slugSuggestion)
    // The address saved, and another podcast holds it: the field says so
    // until it changes (27e).
    if (result.takenSlug !== null) {
      takenSlugs.add(result.takenSlug)
      form.validate({ name: fields.slug.name })
    }

    // A new title reaches the breadcrumb and the tab title; the first save
    // with content ends the empty draft (0020).
    const saved = savedValuesRef.current
    const savedTitle =
      loadedTitleRef.current === null &&
      (saved.title ?? '') === '' &&
      (saved.description ?? '') === ''
        ? null
        : getPodcastDisplayTitle(saved.title ?? '')
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

  // The cover saves on its own as it is picked (27e, as 26c). Refused for
  // the hold: as the whole-form save does (24h, 24i).
  const coverUpload = useCoverUpload({
    action: href('/administration/podcasts/:podcastId/cover', { podcastId }),
    cancelledAnnouncement: COVER_UPLOAD_CANCELLED_ANNOUNCEMENT,
    crossedAnnouncement: COVER_CANCEL_CROSSED_ANNOUNCEMENT.podcast,
    onDeleted: editHold.recheck,
    onNotHeld: async (heldByName) => {
      if (heldByName === null) return editHold.retake()
      await editHold.recheck()
      return false
    },
    onSaved: acknowledgeSaved,
    storedKey: podcast.cover?.sources.src ?? null,
    tabId: editHold.tabId,
  })
  useEffect(() => {
    setIsCoverUploading(coverUpload.isUploading)
  }, [coverUpload.isUploading])
  const coverInputRef = useRef<HTMLInputElement>(null)
  // A refused or failed pick's sentence describes the field (26d).
  const coverProblemId = useId()
  // The control that started an upload is gone once its preview stands in
  // the slot; when the upload ends, the cover's first control takes the focus
  // back, unless the author moved on.
  const coverRef = useRef<HTMLElement>(null)
  const wasCoverBusyRef = useRef(false)
  useEffect(() => {
    const wasBusy = wasCoverBusyRef.current
    wasCoverBusyRef.current = coverUpload.isBusy
    if (!wasBusy || coverUpload.isBusy) return
    const focused = document.activeElement
    if (focused !== null && focused !== document.body) return
    coverRef.current
      ?.querySelector<HTMLElement>(
        'button:not([disabled]), input[type="file"]:not([hidden])',
      )
      ?.focus()
  }, [coverUpload.isBusy])
  // On the pick the focus goes to the row's *Zrušit* (26c), as the control
  // that had it is gone.
  useEffect(() => {
    if (!coverUpload.isUploading) return
    coverRef.current?.querySelector<HTMLElement>('button')?.focus()
  }, [coverUpload.isUploading])

  // The labels of the fields that differ from this editor's last save; the
  // author only where the editor chooses it.
  const getUnsentLabels = () =>
    FIELD_ORDER.filter(
      (field) =>
        (field !== 'authorId' || authors !== null) &&
        shownValuesRef.current[field].trim() !==
          (savedValuesRef.current[field] ?? ''),
    ).map((field) => FIELD_LABELS[field])
  // A cover upload under way or failed at that moment did not save, and
  // comes last (copy utgh1hb7).
  const getUnsentCoverLabels = () =>
    coverUpload.isUploading || coverUpload.failure?.change === 'upload'
      ? [COVER_LABEL]
      : []

  // The hold went elsewhere: nothing more goes out, and the editor says
  // which fields stayed unsent (24h, 24i).
  const handleHoldLoss = useEffectEvent(async () => {
    const { state } = editHold
    if (state.status !== 'lost' && state.status !== 'changed') return

    const hasUnsentChanges = await autosave.stop()
    const unsentLabels = [
      ...(hasUnsentChanges ? getUnsentLabels() : []),
      ...getUnsentCoverLabels(),
    ]
    const isChangedDialog =
      state.status === 'changed' && unsentLabels.length > 0

    // Only an editor that held the edit lost it.
    setHoldLoss({
      dialog: !hasHeldRef.current
        ? null
        : isChangedDialog
          ? 'changed'
          : state.holder === null
            ? null
            : 'taken',
      holderName: state.holder?.name ?? '',
      unsentLabels,
    })
  })
  const lostStatus = lostHold?.status ?? null
  useEffect(() => {
    if (lostStatus !== null) void handleHoldLoss()
  }, [lostStatus])

  // Deleted: nothing more goes out, and the dialog says so every time, with
  // the fields that stayed unsent (24k).
  const [deletion, setDeletion] = useState<{
    isDialogOpen: boolean
    unsentLabels: string[]
    hadCover: boolean
  } | null>(null)
  const handleDeletion = useEffectEvent(async () => {
    // A takeover before the delete has nothing left to say (24k).
    setHoldLoss(null)
    // An upload under way did not save; it ends with nothing to remove.
    const unsentCoverLabels = getUnsentCoverLabels()
    coverUpload.abandon()
    const hasUnsentChanges = await autosave.stop()
    setDeletion({
      hadCover: podcast.cover !== null,
      isDialogOpen: true,
      unsentLabels: [
        ...(hasUnsentChanges ? getUnsentLabels() : []),
        ...unsentCoverLabels,
      ],
    })
  })
  useEffect(() => {
    if (isDeleted) void handleDeletion()
  }, [isDeleted])
  const closeHoldLossDialog = () =>
    setHoldLoss((current) =>
      current === null ? null : { ...current, dialog: null },
    )
  const reload = () => window.location.reload()

  // Every change of the form saves (24e), once the editor touched it.
  const hasInteractedRef = useRef(false)
  const markInteracted = () => {
    hasInteractedRef.current = true
  }
  const snapshot = JSON.stringify(form.value ?? {}, (key, value) =>
    SNAPSHOT_IGNORED_FIELDS.has(key) ? undefined : value,
  )
  const snapshotRef = useRef(snapshot)
  // Set by Použít …, whose change saves at once instead of after the pause.
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

  // Leaving cancels the upload under way, so *Zavřít* and a link out ask
  // first while the cover uploads (26c, bxy8xxqs). The dialog names a failure
  // from its opening on (moo05ljj). The flag is kept here, read ahead of a
  // render.
  const isCoverUploadingRef = useRef(false)
  isCoverUploadingRef.current = coverUpload.isUploading
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
      failureCountAtOpen: coverUpload.failureCount,
      go,
      stay,
      to,
    })
  // The dialog's leave cancels the upload if it still runs, and goes once the
  // server has heard of it; once it no longer runs it only closes.
  const leaveDespiteUpload = () => {
    if (pendingLeave === null) return
    const cancelled = coverUpload.cancel()
    isCoverUploadingRef.current = false
    setPendingLeave(null)
    void cancelled
      .then(() => leaveTo(pendingLeave.to, pendingLeave.go))
      .finally(pendingLeave.stay)
  }
  const stayDespiteUpload = () => {
    pendingLeave?.stay()
    setPendingLeave(null)
  }

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname &&
      (autosave.hasUnsavedChanges() || isCoverUploadingRef.current),
  )
  const handleBlocked = useEffectEvent(() => {
    if (blocker.state !== 'blocked') return
    const { pathname, search, hash } = blocker.location
    const to = `${pathname}${search}${hash}`
    const settle = () => {
      if (blocker.state === 'blocked') blocker.reset()
    }

    if (isCoverUploadingRef.current) {
      askBeforeLeaving(to, () => blocker.proceed(), settle)
      return
    }
    void leaveTo(to, () => blocker.proceed()).finally(settle)
  })
  useEffect(() => {
    if (blocker.state === 'blocked') handleBlocked()
  }, [blocker.state])

  const { onSubmit: conformOnSubmit, ...formProps } = getFormProps(form)

  // Nothing posts the form: Enter in a field saves at once. Conform runs its
  // own intents as a submit (Použít …); those wait for the pause like typing.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    const isConformIntent =
      event.nativeEvent.submitter?.getAttribute('name') === CONFORM_INTENT_NAME
    conformOnSubmit(event)
    event.preventDefault()
    if (!isConformIntent) void autosave.flush()
  }

  const handleClose = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (isCoverUploadingRef.current) {
      askBeforeLeaving(closeHref, () => navigate(closeHref))
      return
    }
    void leaveTo(closeHref, () => navigate(closeHref))
  }

  // The address follows the title until changed by hand (24a, 27e): one that
  // differs from the title's as the editor opens was changed by hand. One
  // cleared by hand stays empty, and 27i asks for it at submit.
  const [isSlugInitiallyManual] = useState(
    podcast.slug !== slugify(podcast.title),
  )
  const {
    handleBlur: handleSlugBlur,
    handleFocus: handleSlugFocus,
    handleInput: handleSlugInput,
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

  const isLocked = !isHolding
  const isReadOnly = lostHold !== null || isDeleted

  if (!isLocked) {
    shownValuesRef.current = {
      authorId: fields.authorId.value ?? '',
      description: fields.description.value ?? '',
      slug: fields.slug.value ?? '',
      title: fields.title.value ?? '',
    }
  }
  const shownValues = shownValuesRef.current

  const title = shownValues.title.trim()
  const webSlug = slugify(shownValues.slug)
  // The heading is the podcast's name; a new draft goes by the button that
  // made it (27e; copy utgh1hb7).
  const heading =
    title !== ''
      ? title
      : podcast.isEmptyDraft
        ? 'Nový podcast'
        : getPodcastDisplayTitle('')

  const saveLine = getPodcastSaveLineText({
    hasCover: podcast.cover !== null || coverUpload.isUploading,
    now,
    savedAt,
    // Without the hold nothing goes out: the line says the last save (24h).
    status:
      !isHolding &&
      (autosave.status === 'pending' || autosave.status === 'saving')
        ? 'idle'
        : autosave.status,
  })

  // The only sign of saving, without a toast (24e); while only reading, who
  // edits it now, or that it is free again (24h).
  const renderSaveLine = () =>
    // The last line, with nothing to offer (24e, 24k).
    isDeleted ? (
      <p className={styles.saveLine}>smazáno</p>
    ) : lostHold !== null && lostHold.holder !== null ? (
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
        Podcast lze znovu upravovat
        <ButtonLink onClick={reload} type={'button'}>
          Pokračovat v úpravě
        </ButtonLink>
      </p>
    ) : autosave.status === 'failed' ? (
      <p className={styles.saveLine} role={'alert'}>
        <span className={styles.saveFailure}>{saveLine}</span>
        <ButtonLink onClick={autosave.retry} type={'button'}>
          Zkusit znovu
        </ButtonLink>
      </p>
    ) : (
      <p className={styles.saveLine}>{saveLine}</p>
    )

  const editorSentence = getPodcastEditorSentence({
    isOwn,
    isSubmitted: podcast.submission !== null,
  })

  // The button goes once its value is in, so the focus moves to the field
  // that got the value, not to the top of the page.
  const focusField = (name: string) => {
    const input = formRef.current?.elements.namedItem(name)
    if (input instanceof HTMLInputElement) input.focus()
  }

  // A free address for a taken one: filled in and saved (27e, as 24d).
  const applySlugSuggestion = (value: string) => {
    // A chosen address no longer follows the title.
    handleSlugInput()
    form.update({ name: fields.slug.name, value })
    isFlushOnChangeRef.current = true
    focusField(fields.slug.name)
  }

  // Úpravu přebírá … in its paragraphs (24h).
  const [holdTakenLead = '', ...holdTakenRest] =
    holdLoss?.dialog === 'taken'
      ? formatPodcastHoldTakenDescription({
          now,
          savedAt: hasSaved ? savedAt : null,
          unsentLabels: holdLoss.unsentLabels,
        })
      : []

  const openCoverPicker = () => coverInputRef.current?.click()
  const { failure: coverFailure } = coverUpload

  // A failed upload with what to do next (26d): *Zkusit znovu* only where the
  // same file may work, and another file always.
  const renderCoverFailureActions = () =>
    !isReadOnly && (
      <div className={styles.coverActions}>
        {coverFailure?.canRetry && (
          <ButtonLink
            disabled={isLocked}
            onClick={coverUpload.retry}
            type={'button'}
          >
            Zkusit znovu
          </ButtonLink>
        )}
        <ButtonLink
          disabled={isLocked}
          onClick={openCoverPicker}
          type={'button'}
        >
          Vybrat jiný soubor
        </ButtonLink>
      </div>
    )

  // The cover column (27e, as 26c): the picked cover dimmed while it uploads,
  // the stored one with *Vyměnit*, a failed first upload in its rose card, or
  // the dashed field. Deleted, the cover went with the podcast (24k).
  const renderCover = () => {
    if (isDeleted) return null

    // The picked cover, dimmed until it saves (26c).
    const preview = coverUpload.previewUrl !== null && (
      <img
        alt={''}
        className={clsx(styles.coverImage, styles.coverUploading)}
        src={coverUpload.previewUrl}
      />
    )

    // The row stands under the picked cover until it saves (26c, bxy8xxqs).
    const uploadStatus = coverUpload.upload !== null && (
      <UploadStatus
        cancelLabel={CANCEL_COVER_UPLOAD_LABEL}
        onCancel={() => void coverUpload.cancel()}
      />
    )

    if (podcast.cover === null && preview !== false) {
      return (
        <>
          {preview}
          {uploadStatus}
        </>
      )
    }

    if (podcast.cover === null && coverFailure?.change === 'upload') {
      return (
        <FailedFile fileName={coverFailure.fileName ?? ''}>
          <ErrorMessage>{coverFailure.sentence}</ErrorMessage>
          {renderCoverFailureActions()}
        </FailedFile>
      )
    }

    if (podcast.cover === null) {
      return (
        <>
          <FileDropField
            accept={'image/*'}
            errorId={
              coverUpload.rejection === null ? undefined : coverProblemId
            }
            hint={'nebo ji sem přetáhněte · obrázek do 5 MB'}
            isDisabled={
              isLocked || coverUpload.isBusy || coverUpload.isCancelling
            }
            label={'Vybrat obálku'}
            onPick={coverUpload.pick}
            shape={'square'}
          />
          {coverUpload.rejection !== null && (
            <div id={coverProblemId}>
              <ErrorMessage>{coverUpload.rejection}</ErrorMessage>
            </div>
          )}
        </>
      )
    }

    // A replacement on its way takes the image's place only: the actions and
    // the note keep theirs, so nothing under them moves.
    return (
      <>
        {preview || (
          <Image
            {...podcast.cover.sources}
            alt={podcast.cover.altText}
            className={styles.coverImage}
            sizes={'220px'}
          />
        )}
        {/* A failed or refused replacement: the stored cover stays above it. */}
        {(coverFailure !== null || coverUpload.rejection !== null) && (
          <div id={coverProblemId}>
            <ErrorMessage>
              {coverFailure?.sentence ?? coverUpload.rejection}
            </ErrorMessage>
          </div>
        )}
        {/* The row and *Vyměnit* take one slot, so the note under them
            stays put when the upload ends (26c). */}
        {uploadStatus ||
          (coverFailure !== null
            ? renderCoverFailureActions()
            : !isReadOnly &&
              !coverUpload.isCancelling && (
                <div className={styles.coverActions}>
                  {/* While it uploads it only says it waits, so it keeps the
                    focus. */}
                  <ButtonLink
                    aria-describedby={
                      coverUpload.rejection === null
                        ? undefined
                        : coverProblemId
                    }
                    aria-disabled={coverUpload.isBusy || undefined}
                    disabled={isLocked}
                    onClick={() => {
                      if (!coverUpload.isBusy) openCoverPicker()
                    }}
                    type={'button'}
                  >
                    Vyměnit
                  </ButtonLink>
                </div>
              ))}
        {/* The web crops another shape (27e, 5hl7vx3a). */}
        {!podcast.cover.isSquare && (
          <p className={styles.coverNote}>
            Obálka není čtvercová, na webu se ořízne.
          </p>
        )}
      </>
    )
  }

  // What still uploads and what stays (26c); once it no longer runs, how it
  // ended (copy hx72s8sv).
  const renderLeaveDialog = ({
    failureCountAtOpen,
  }: NonNullable<typeof pendingLeave>) => {
    const isUploading = coverUpload.upload !== null
    const hasFailed = coverUpload.failureCount > failureCountAtOpen
    const paragraphs = isUploading
      ? [
          COVER_UPLOADING_SENTENCE,
          coverUpload.upload?.replaces && ORIGINAL_COVER_STAYS_SENTENCE.podcast,
        ]
      : hasFailed
        ? [
            COVER_FAILED_SENTENCE,
            coverUpload.failure?.replaces &&
              ORIGINAL_COVER_STAYED_SENTENCE.podcast,
          ]
        : [COVER_UPLOAD_DONE_SENTENCE]

    return (
      <CancelUploadDialog
        isUploading={isUploading}
        onLeave={leaveDespiteUpload}
        onStay={stayDespiteUpload}
      >
        {paragraphs
          .filter((paragraph) => typeof paragraph === 'string')
          .map((paragraph) => (
            <AdminModalDescription key={paragraph}>
              {paragraph}
            </AdminModalDescription>
          ))}
      </CancelUploadDialog>
    )
  }

  return (
    <AdminPage measure={'form'}>
      <header className={styles.header}>
        <div className={styles.title}>
          <div className={styles.titleLine}>
            <PageTitle>{heading}</PageTitle>
            {/* A deleted podcast has no state (24k). */}
            {!isDeleted && (
              <StatusTag state={podcast.submission?.state ?? 'draft'} />
            )}
          </div>
          {renderSaveLine()}
        </div>
        {/* Sends what waits, then leaves (24e). */}
        <LinkButton onClick={handleClose} to={closeHref} variant={'outline'}>
          Zavřít
        </LinkButton>
      </header>

      {editorSentence !== null && !isDeleted && (
        <p className={styles.sentence}>{editorSentence}</p>
      )}

      {readOnlyNotice !== null && (
        <AdminParagraph>{readOnlyNotice}</AdminParagraph>
      )}

      {/* Deleted, what is shown is the only copy (24k; copy utgh1hb7). */}
      {isDeleted && (
        <Callout className={styles.deletedWarning} tone={'warning'}>
          <div className={styles.deletedContent}>
            <p className={styles.deletedTitle}>
              Zobrazené údaje podcastu zůstaly jen v tomto editoru.
            </p>
            <p className={styles.deletedAdvice}>
              Než stránku obnovíte, opustíte nebo editor zavřete, zkopírujte si
              popis a poznamenejte ostatní hodnoty, které potřebujete.
            </p>
          </div>
        </Callout>
      )}

      {pendingLeave !== null && renderLeaveDialog(pendingLeave)}

      {deletion?.isDialogOpen && (
        <ContentDeletedDialog
          description={
            'Podcast už nelze upravovat. Zobrazené údaje zůstanou jen do obnovení stránky, odchodu nebo zavření editoru.'
          }
          onOpenList={() => navigate(listHref)}
          onStay={() =>
            setDeletion((current) =>
              current === null ? null : { ...current, isDialogOpen: false },
            )
          }
          title={'Podcast byl smazán'}
        >
          {deletion.hadCover && (
            <AdminModalDescription>
              Obálka podcastu byla smazána.
            </AdminModalDescription>
          )}
          {deletion.unsentLabels.length > 0 && (
            <AdminModalDescription>
              {`Některé změny nejsou uložené. Neuložené změny: ${deletion.unsentLabels.join(', ')}.`}
            </AdminModalDescription>
          )}
          <AdminModalDescription>
            Před odchodem na seznam si zkopírujte popis a poznamenejte ostatní
            hodnoty, které potřebujete.
          </AdminModalDescription>
        </ContentDeletedDialog>
      )}

      {holdLoss?.dialog === 'taken' && !isDeleted && (
        <HoldTakenDialog
          description={holdTakenLead}
          holderName={holdLoss.holderName}
          onOpenDetail={() => navigate(closeHref)}
          onStay={closeHoldLossDialog}
        >
          {[
            ...holdTakenRest,
            ...formatUnsavedPodcastAdvice(
              holdLoss.unsentLabels,
              'Před otevřením detailu',
            ),
          ].map((paragraph) => (
            <AdminModalDescription key={paragraph}>
              {paragraph}
            </AdminModalDescription>
          ))}
        </HoldTakenDialog>
      )}
      {holdLoss?.dialog === 'changed' &&
        editHold.state.status === 'changed' && (
          <ContentChangedDialog
            canReload={canReloadChanged}
            description={formatPodcastChangedDescription({
              awayMilliseconds: editHold.state.awayMilliseconds,
              now: new Date(),
              savedAt: hasSaved ? savedAt : null,
            })}
            onClose={closeHoldLossDialog}
            onOpenDetail={() => navigate(closeHref)}
            onReload={reload}
            title={'Podcast se mezitím změnil'}
          >
            {[
              `Neuložené změny: ${holdLoss.unsentLabels.join(', ')}.`,
              ...formatUnsavedPodcastAdvice(
                holdLoss.unsentLabels,
                canReloadChanged
                  ? 'Před načtením aktuální verze'
                  : 'Před otevřením detailu',
              ),
            ].map((paragraph) => (
              <AdminModalDescription key={paragraph}>
                {paragraph}
              </AdminModalDescription>
            ))}
          </ContentChangedDialog>
        )}

      {/* Someone else's edit, only the Coordinator's to take (24g). */}
      {editHold.state.status === 'held-by-other' && isApprover && (
        <EditHoldDialog
          content={'podcast'}
          description={formatTakeOverDescription(
            editHold.state.holder,
            new Date(),
            'podcast',
          )}
          key={editHold.attempt}
          kind={'take-over'}
          onCancel={() => navigate(closeHref)}
          onConfirm={() => void editHold.takeOver()}
        />
      )}
      {editHold.state.status === 'own-other-tab' && (
        <EditHoldDialog
          content={'podcast'}
          key={editHold.attempt}
          kind={'other-tab'}
          onCancel={() => navigate(closeHref)}
          onConfirm={() => void editHold.takeOver()}
        />
      )}

      <FormProvider context={form.context}>
        <Form
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

          {/* The cover left, the details right (27e, as 26c). */}
          <div className={styles.layout}>
            <div className={styles.columns}>
              {/* The cover with its caption, as the issue's (26c); 27e draws
                  no caption, so it is only read. */}
              <figure
                aria-busy={coverUpload.isBusy || undefined}
                className={styles.coverColumn}
                ref={coverRef}
              >
                <figcaption className={'screen-reader-only'}>Obálka</figcaption>
                {/* *Vyměnit* and *Vybrat jiný soubor* open it; a pick saves
                  on its own, never with the form. */}
                <input
                  accept={'image/*'}
                  form={''}
                  hidden
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    // The same file picked again still changes.
                    event.currentTarget.value = ''
                    if (file !== undefined) coverUpload.pick(file)
                  }}
                  ref={coverInputRef}
                  type={'file'}
                />
                {renderCover()}
                <span className={'screen-reader-only'} role={'status'}>
                  {coverUpload.announcement}
                </span>
                {!isDeleted && (
                  <>
                    <p className={styles.coverNote}>
                      Doporučený tvar: čtverec.
                    </p>
                    <p className={styles.coverNote}>
                      Obálku podcastu použijí i epizody bez vlastní obálky.
                    </p>
                  </>
                )}
              </figure>

              <div className={styles.details}>
                <fieldset className={styles.lock} disabled={isLocked}>
                  <TextField
                    {...getInputProps(fields.title, { type: 'text' })}
                    errors={fields.title.errors}
                    label={'Název'}
                  />
                  <div className={styles.fieldGroup}>
                    <TextField
                      {...getInputProps(fields.slug, { type: 'text' })}
                      errors={fields.slug.errors}
                      // No hint while it follows the title (24a, 27e).
                      hint={
                        isSlugFollowing ? undefined : (
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
                      onBlur={handleSlugBlur}
                      onFocus={handleSlugFocus}
                      onInput={handleSlugInput}
                    />
                    {/* A taken address: a free one, filled in and saved (27e). */}
                    {fields.slug.errors !== undefined &&
                      slugSuggestion !== null &&
                      !isReadOnly && (
                        <ButtonLink
                          className={styles.offer}
                          onClick={() => applySlugSuggestion(slugSuggestion)}
                          type={'button'}
                        >
                          Použít {slugSuggestion}
                        </ButtonLink>
                      )}
                  </div>
                  <AdminTextarea
                    field={fields.description}
                    hint={'Stručně popište, o čem podcast je.'}
                    label={'Popis'}
                    textareaProps={{ className: styles.descriptionInput }}
                  />
                  {/* Only the Coordinator chooses the author (27e, as 25c). */}
                  {authors !== null && (
                    <Select
                      {...getSelectProps(fields.authorId)}
                      errors={fields.authorId.errors}
                      label={'Autor'}
                    >
                      {authors.map((author) => (
                        <option key={author.id} value={author.id}>
                          {author.name}
                        </option>
                      ))}
                    </Select>
                  )}
                </fieldset>

                {/* What a reader sees, under a line, as 27e draws it. */}
                <dl className={styles.webPreview}>
                  <dt className={styles.webPreviewLabel}>Na webu jako</dt>
                  {title !== '' && <dd>{title}</dd>}
                  {webSlug !== '' && (
                    <dd className={styles.tertiary}>/podcasts/{webSlug}</dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </Form>
      </FormProvider>
    </AdminPage>
  )
}
