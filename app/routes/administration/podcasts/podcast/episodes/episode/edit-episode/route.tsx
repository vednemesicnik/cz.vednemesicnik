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
  type FocusEvent,
  type FormEvent,
  type MouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  type SubmitEvent,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
} from 'react'
import { href, useBlocker, useNavigate, useRevalidator } from 'react-router'
import { AdminDetailAside } from '~/components/admin/admin-detail-aside'
import { AdminDetailLayout } from '~/components/admin/admin-detail-layout'
import { AdminDetailMain } from '~/components/admin/admin-detail-main'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { AdminTextarea } from '~/components/admin/admin-textarea'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { ButtonLink } from '~/components/button-link'
import { Callout } from '~/components/callout'
import { ContentChangedDialog } from '~/components/content-changed-dialog'
import { ContentDeletedDialog } from '~/components/content-deleted-dialog'
import { EditHoldDialog } from '~/components/edit-hold-dialog'
import { ErrorMessage } from '~/components/error-message'
import { Form } from '~/components/form'
import { HoldTakenDialog } from '~/components/hold-taken-dialog'
import { Image } from '~/components/image'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { Select } from '~/components/select'
import { StatusTag } from '~/components/status-tag'
import { TextField } from '~/components/text-field'
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
import { formatEpisodeTitle } from '~/utils/podcast-episode/format-episode-title'
import { slugify } from '~/utils/slugify'
import { useAutoSlug } from '~/utils/use-auto-slug'

import { isValidEpisodeLinkUrl } from '../../utils/is-valid-episode-link-url'
import { schema } from './_schema'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { EpisodeLinks } from './components/episode-links'
import {
  createEditorSchema,
  TAKEN_NUMBER_MESSAGE,
} from './utils/create-editor-schema'
import { formatEpisodeChangedDescription } from './utils/format-episode-changed-description'
import { formatEpisodeHoldTakenDescription } from './utils/format-episode-hold-taken-description'
import {
  COVER_LABEL,
  formatUnsavedEpisodeAdvice,
} from './utils/format-unsaved-episode-advice'
import { getEpisodeEditorSentence } from './utils/get-episode-editor-sentence'
import { getEpisodeSaveLineText } from './utils/get-episode-save-line-text'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

// What the save route answers (logs 0022, 0048).
type SaveResponse =
  | {
      status: 'saved'
      updatedAt: string
      takenNumber: number | null
      freeNumber: number | null
      takenSlug: string | null
      slugSuggestion: string | null
    }
  | { status: 'not-held'; heldByName: string | null }

// The name of the button Conform submits its intents with.
const CONFORM_INTENT_NAME = '__intent__'

// The tab's own fields are no change of the episode.
const SNAPSHOT_IGNORED_FIELDS = new Set<string>([
  FORM_CONFIG.authenticityToken.name,
  EDIT_HOLD_CONFIG.tabIdName,
])

// The labels a list of unsent fields uses (copy ahizoh4o).
const FIELD_LABELS = {
  authorId: 'Autor',
  description: 'Popis',
  links: 'Odkazy na epizodu',
  number: 'Číslo',
  slug: 'Adresa',
  title: 'Název',
} as const

type FieldName = keyof typeof FIELD_LABELS
type FieldValues = Record<FieldName, string>

// The fields in the form's order, as a list of unsent ones names them.
const FIELD_ORDER: FieldName[] = [
  'title',
  'description',
  'links',
  'number',
  'slug',
  'authorId',
]

// The closing sentence after a number that can't be read (copy ahizoh4o).
const UNSAVED_NUMBER_CHANGE = 'Změna čísla se neuložila.'

const LINK_NAME_PATTERN = /^links\[(\d+)\]\.(label|url)$/

// What the editor says once the hold went elsewhere (24h, 24i): which dialog,
// and which fields stayed unsent.
type HoldLoss = {
  dialog: 'taken' | 'changed' | null
  holderName: string
  unsentLabels: string[]
}

// The links as one comparable value; a fully empty row is no link (27d).
const serializeLinks = (
  links: ReadonlyArray<{ label?: string; url?: string } | undefined>,
) =>
  JSON.stringify(
    links
      .map((link) => [link?.label?.trim() ?? '', link?.url?.trim() ?? ''])
      .filter(([label, url]) => label !== '' || url !== ''),
  )

// A field's value in the form, read as the input holds it.
const readValues = (formData: FormData | null): Partial<FieldValues> => {
  if (formData === null) return {}
  const values: Partial<FieldValues> = {}
  const links: { label?: string; url?: string }[] = []
  for (const [key, value] of formData) {
    if (typeof value !== 'string') continue
    const linkMatch = LINK_NAME_PATTERN.exec(key)
    if (linkMatch !== null) {
      const index = Number(linkMatch[1])
      links[index] = { ...links[index], [linkMatch[2]]: value }
    } else if (key in FIELD_LABELS && key !== 'links') {
      values[key as FieldName] = value.trim()
    }
  }
  values.links = serializeLinks(links)
  return values
}

const parseNumber = (value: string | undefined) => {
  const number = Number(value)
  return value === undefined ||
    value.trim() === '' ||
    !Number.isInteger(number) ||
    number < 1
    ? null
    : number
}

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { authors, episode, isApprover, isOwn, podcast } = loaderData
  const { podcastId, episodeId } = params
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  // The title the breadcrumb and the tab show, as last loaded.
  const loadedTitle = episode.isEmptyDraft ? null : formatEpisodeTitle(episode)
  const loadedTitleRef = useRef(loadedTitle)
  loadedTitleRef.current = loadedTitle
  const formRef = useRef<HTMLFormElement>(null)
  const saveAction = href(
    '/administration/podcasts/:podcastId/episodes/:episodeId/save',
    { episodeId, podcastId },
  )

  // Autosave is set up after the hold; a closing page asks it through this.
  const leaveSaveRef = useRef<() => FormData | null>(() => null)
  // The cover upload is set up after the hold too; the hold reads this.
  const [isCoverUploading, setIsCoverUploading] = useState(false)

  // One tab edits at a time (07g, 24g).
  const editHold = useEditHold({
    action: href(
      '/administration/podcasts/:podcastId/episodes/:episodeId/edit-hold',
      { episodeId, podcastId },
    ),
    entity: 'podcast_episode',
    id: episodeId,
    // A first cover on its way is content: the release must not delete the
    // draft under it.
    isEmpty: episode.isEmptyDraft && !isCoverUploading,
    leaveSave: {
      action: saveAction,
      getFormData: () => leaveSaveRef.current(),
    },
    updatedAt: episode.updatedAt,
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
  // The episode is gone for good (24k, log 0036).
  const isDeleted = editHold.state.status === 'deleted'
  const readOnlyNotice = getReadOnlyNotice(editHold.state, 'episode')
  // Changed meanwhile, and free to edit again here (24i).
  const canReloadChanged =
    editHold.state.status === 'changed' &&
    editHold.state.holder === null &&
    editHold.state.isEditable
  const [holdLoss, setHoldLoss] = useState<HoldLoss | null>(null)

  // The podcast's table of episodes is the episode's list (27b).
  const listHref = href('/administration/podcasts/:podcastId', { podcastId })
  // An empty draft has no detail (0020); deleted, the detail is gone too.
  const closeHref =
    episode.isEmptyDraft || isDeleted
      ? listHref
      : href('/administration/podcasts/:podcastId/episodes/:episodeId', {
          episodeId,
          podcastId,
        })

  // A new episode has one empty row to paste the first address into (27d);
  // a fully empty row is not saved.
  const loadedLinks =
    episode.links.length === 0
      ? [{ label: '', url: '' }]
      : episode.links.map(({ label, url }) => ({ label, url }))
  const loadedValues: FieldValues = {
    authorId: episode.authorId,
    description: episode.description,
    links: serializeLinks(loadedLinks),
    number: episode.number === null ? '' : String(episode.number),
    slug: episode.slug,
    title: episode.title,
  }

  // A locked fieldset leaves the form's data, so the heading, the preview and
  // the list of unsent fields keep the values the editor last showed (07g).
  const shownValuesRef = useRef(loadedValues)

  // Numbers and addresses another episode holds as published (27f, log
  // 0039); the schema turns them into the fields' errors.
  const takenNumbers = useTakenValues([
    episode.takenNumber === null ? null : String(episode.takenNumber),
  ])
  const takenSlugs = useTakenValues([episode.takenSlug])

  const [form, fields] = useForm({
    defaultValue: {
      authorId: episode.authorId,
      description: episode.description,
      links: loadedLinks,
      number: loadedValues.number,
      slug: episode.slug,
      title: episode.title,
    },
    id: 'edit-episode',
    // Parsed here, so a number that can't be read is said at its field, the
    // save leaving it out (log 0034), and so are a taken number or address
    // and an invalid link address, which save (27d, 27f).
    onValidate: ({ formData }) =>
      parseWithZod(formData, {
        schema: createEditorSchema({
          isNumberTaken: takenNumbers.has,
          isSlugTaken: takenSlugs.has,
        }),
      }),
    shouldRevalidate: 'onInput',
    shouldValidate: 'onBlur',
  })

  // What is wrong when the page loads, the fields say once the editor holds
  // the edit: a locked fieldset leaves its fields out of the form (27d, 27f).
  const validateLoaded = useEffectEvent(() => {
    if (
      episode.takenNumber !== null ||
      episode.takenSlug !== null ||
      episode.links.some(({ url }) => url !== '' && !isValidEpisodeLinkUrl(url))
    ) {
      form.validate()
    }
  })
  useEffect(() => {
    if (isHolding) validateLoaded()
  }, [isHolding])

  // The episode's last save, as the line beside the tag says it (24e). A new
  // draft has none until its first save.
  const [savedAt, setSavedAt] = useState(() =>
    episode.isEmptyDraft ? null : new Date(episode.updatedAt),
  )
  const lastSavedAtRef = useRef(episode.updatedAt)
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

  // A free number and address to offer for taken ones (27f).
  const [freeNumber, setFreeNumber] = useState(episode.freeNumber)
  const [slugSuggestion, setSlugSuggestion] = useState(episode.slugSuggestion)

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

    // A number that can't be read stayed as it was stored (log 0034).
    const sentValues = readValues(formData)
    const parsed = parseWithZod(formData, { schema })
    const isNumberUnread =
      parsed.status !== 'success' &&
      Object.keys(parsed.error ?? {}).includes('number')
    savedValuesRef.current = isNumberUnread
      ? { ...sentValues, number: savedValuesRef.current.number }
      : sentValues
    acknowledgeSaved(result.updatedAt)
    setFreeNumber(result.freeNumber)
    setSlugSuggestion(result.slugSuggestion)
    // The value saved, and another episode holds it: the field says so until
    // it changes (27f).
    if (result.takenNumber !== null) {
      takenNumbers.add(String(result.takenNumber))
      form.validate({ name: fields.number.name })
    }
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
      (saved.description ?? '') === '' &&
      saved.links === '[]'
        ? null
        : formatEpisodeTitle({
            number: parseNumber(saved.number),
            title: saved.title ?? '',
          })
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

  // The own cover saves on its own as it is picked (27d, as 26c). Refused
  // for the hold: as the whole-form save does (24h, 24i).
  const coverUpload = useCoverUpload({
    action: href(
      '/administration/podcasts/:podcastId/episodes/:episodeId/cover',
      { episodeId, podcastId },
    ),
    onDeleted: editHold.recheck,
    onNotHeld: async (heldByName) => {
      if (heldByName === null) return editHold.retake()
      await editHold.recheck()
      return false
    },
    onSaved: acknowledgeSaved,
    storedKey: episode.cover?.sources.src ?? null,
    tabId: editHold.tabId,
  })
  useEffect(() => {
    setIsCoverUploading(coverUpload.isUploading)
  }, [coverUpload.isUploading])
  const coverInputRef = useRef<HTMLInputElement>(null)
  // A refused or failed pick's sentence describes the field (26d).
  const coverProblemId = useId()
  // The field's first action, which takes the focus back once a change
  // ended: the action that had it may be gone.
  const firstCoverActionRef = useRef<HTMLButtonElement>(null)
  const wasCoverBusyRef = useRef(false)
  useEffect(() => {
    const wasBusy = wasCoverBusyRef.current
    wasCoverBusyRef.current = coverUpload.isBusy
    if (!wasBusy || coverUpload.isBusy) return
    const focused = document.activeElement
    if (focused === null || focused === document.body) {
      firstCoverActionRef.current?.focus()
    }
  }, [coverUpload.isBusy])

  // The labels of the fields that differ from this editor's last save; the
  // author only where the editor chooses it.
  const getUnsentLabels = () =>
    FIELD_ORDER.filter(
      (field) =>
        (field !== 'authorId' || authors !== null) &&
        (field === 'links'
          ? shownValuesRef.current.links
          : shownValuesRef.current[field].trim()) !==
          (savedValuesRef.current[field] ?? ''),
    ).map((field) => FIELD_LABELS[field])
  // A cover upload under way or failed at that moment did not save, and
  // comes last (copy ahizoh4o).
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
    hadSavedLinks: boolean
    hadOwnCover: boolean
  } | null>(null)
  const handleDeletion = useEffectEvent(async () => {
    // A takeover before the delete has nothing left to say (24k).
    setHoldLoss(null)
    const hasUnsentChanges = await autosave.stop()
    setDeletion({
      hadOwnCover: episode.cover !== null,
      hadSavedLinks: (savedValuesRef.current.links ?? '[]') !== '[]',
      isDialogOpen: true,
      unsentLabels: [
        ...(hasUnsentChanges ? getUnsentLabels() : []),
        ...getUnsentCoverLabels(),
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

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname &&
      autosave.hasUnsavedChanges(),
  )
  const handleBlocked = useEffectEvent(() => {
    if (blocker.state !== 'blocked') return
    const { pathname, search, hash } = blocker.location
    void leaveTo(`${pathname}${search}${hash}`, () =>
      blocker.proceed(),
    ).finally(() => {
      if (blocker.state === 'blocked') blocker.reset()
    })
  })
  useEffect(() => {
    if (blocker.state === 'blocked') handleBlocked()
  }, [blocker.state])

  const { onSubmit: conformOnSubmit, ...formProps } = getFormProps(form)

  // Nothing posts the form: Enter in a field saves at once. Conform runs its
  // own intents as a submit (a label following its address, a moved link,
  // Použít …); those wait for the pause like typing.
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    const isConformIntent =
      event.nativeEvent.submitter?.getAttribute('name') === CONFORM_INTENT_NAME
    conformOnSubmit(event)
    event.preventDefault()
    if (!isConformIntent) void autosave.flush()
  }

  const handleClose = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    void leaveTo(closeHref, () => navigate(closeHref))
  }

  // The address follows the title until changed by hand (24a, tly4a163): one
  // that differs from the title's as the editor opens was changed by hand.
  const [isSlugInitiallyManual] = useState(
    episode.slug !== '' && episode.slug !== slugify(episode.title),
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

  const isLocked = !isHolding
  const isReadOnly = lostHold !== null || isDeleted

  if (!isLocked) {
    shownValuesRef.current = {
      authorId: fields.authorId.value ?? '',
      description: fields.description.value ?? '',
      links: serializeLinks(
        fields.links.getFieldList().map((link) => link.value),
      ),
      number: fields.number.value ?? '',
      slug: fields.slug.value ?? '',
      title: fields.title.value ?? '',
    }
  }
  const shownValues = shownValuesRef.current

  const number = parseNumber(shownValues.number)
  const title = shownValues.title.trim()
  // An episode with a title has an address: the title's, until one is typed.
  const webSlug = slugify(shownValues.slug) || slugify(title)
  const webTitle = title === '' ? null : formatEpisodeTitle({ number, title })

  const saveLine = getEpisodeSaveLineText({
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
        Epizodu lze znovu upravovat
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

  const editorSentence = getEpisodeEditorSentence({
    isOwn,
    isSubmitted: episode.submission !== null,
  })

  // A number that can't be read leaves the stored one (log 0034), and its
  // error says so (copy ahizoh4o). A taken number saved, so its error stands
  // alone (27f).
  const numberErrors = fields.number.errors?.map((error) =>
    error === TAKEN_NUMBER_MESSAGE
      ? error
      : `${error} ${UNSAVED_NUMBER_CHANGE}`,
  )
  const isNumberTaken =
    fields.number.errors?.includes(TAKEN_NUMBER_MESSAGE) ?? false

  // The button goes once its value is in, so the focus moves to the field
  // that got the value, not to the top of the page.
  const focusField = (name: string) => {
    const input = formRef.current?.elements.namedItem(name)
    if (input instanceof HTMLInputElement) input.focus()
  }

  // A free value for a taken one: filled in and saved (27f, as 24d).
  const applyFreeNumber = (value: number) => {
    form.update({ name: fields.number.name, value: String(value) })
    isFlushOnChangeRef.current = true
    focusField(fields.number.name)
  }
  const applySlugSuggestion = (value: string) => {
    // A chosen address no longer follows the title.
    handleSlugInput()
    form.update({ name: fields.slug.name, value })
    isFlushOnChangeRef.current = true
    focusField(fields.slug.name)
  }

  // An address cleared by hand follows the title again: with a title, the
  // episode always has one (27h asks for none).
  const handleSlugFieldBlur = (event: FocusEvent<HTMLInputElement>) => {
    handleSlugBlur(event)
    if (slugify(event.currentTarget.value) === '') resumeSlug()
  }

  // The cover's actions. Without the hold they are disabled like the form's
  // fields (07g); while a change saves they only say so, so the focus stays
  // on the one that started it.
  const openCoverPicker = () => coverInputRef.current?.click()
  const renderCoverAction = (
    label: string,
    onClick: () => void,
    ref?: RefObject<HTMLButtonElement | null>,
  ) => (
    <ButtonLink
      aria-describedby={
        coverUpload.rejection !== null || coverUpload.failure !== null
          ? coverProblemId
          : undefined
      }
      aria-disabled={coverUpload.isBusy || undefined}
      className={styles.coverAction}
      disabled={isLocked}
      onClick={() => {
        if (!coverUpload.isBusy) onClick()
      }}
      ref={ref}
      type={'button'}
    >
      {label}
    </ButtonLink>
  )

  // Úpravu přebírá … in its paragraphs (24h).
  const [holdTakenLead = '', ...holdTakenRest] =
    holdLoss?.dialog === 'taken'
      ? formatEpisodeHoldTakenDescription({
          now,
          savedAt: hasSaved ? savedAt : null,
          unsentLabels: holdLoss.unsentLabels,
        })
      : []

  return (
    <AdminPage measure={'form'}>
      {/* The heading is the title's field (27d, as 24a); the page's name
          is for a screen reader. */}
      <PageTitle className={'screen-reader-only'}>
        {webTitle ?? 'Nová epizoda'}
      </PageTitle>

      <header className={styles.header}>
        <div className={styles.status}>
          {/* A deleted episode has no state (24k). */}
          {!isDeleted && (
            <StatusTag state={episode.submission?.state ?? 'draft'} />
          )}
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

      {/* Deleted, what is shown is the only copy (24k; copy ahizoh4o). */}
      {isDeleted && (
        <Callout className={styles.deletedWarning} tone={'warning'}>
          <div className={styles.deletedContent}>
            <p className={styles.deletedTitle}>
              Zobrazený obsah epizody zůstal jen v tomto editoru.
            </p>
            <p className={styles.deletedAdvice}>
              Než stránku obnovíte, opustíte nebo editor zavřete, zkopírujte si
              popis a poznamenejte ostatní hodnoty, které potřebujete.
            </p>
          </div>
        </Callout>
      )}

      {deletion?.isDialogOpen && (
        <ContentDeletedDialog
          description={
            'Epizodu už nelze upravovat. Zobrazený obsah zůstane jen do obnovení stránky, odchodu nebo zavření editoru.'
          }
          onOpenList={() => navigate(listHref)}
          onStay={() =>
            setDeletion((current) =>
              current === null ? null : { ...current, isDialogOpen: false },
            )
          }
          title={'Epizoda byla smazána'}
        >
          {deletion.hadSavedLinks && (
            <AdminModalDescription>
              Odkazy na epizodu byly smazány.
            </AdminModalDescription>
          )}
          {deletion.hadOwnCover && (
            <AdminModalDescription>
              Vlastní obálka epizody byla smazána.
            </AdminModalDescription>
          )}
          {deletion.unsentLabels.length > 0 && (
            <AdminModalDescription>
              {`Některé změny se nestihly uložit. Neuložené změny: ${deletion.unsentLabels.join(', ')}.`}
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
            ...formatUnsavedEpisodeAdvice(
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
            description={formatEpisodeChangedDescription({
              awayMilliseconds: editHold.state.awayMilliseconds,
              now: new Date(),
              savedAt: hasSaved ? savedAt : null,
            })}
            onClose={closeHoldLossDialog}
            onOpenDetail={() => navigate(closeHref)}
            onReload={reload}
            title={'Epizoda se mezitím změnila'}
          >
            {[
              `Neuložené změny: ${holdLoss.unsentLabels.join(', ')}.`,
              ...formatUnsavedEpisodeAdvice(
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
          content={'episode'}
          description={formatTakeOverDescription(
            editHold.state.holder,
            new Date(),
            'episode',
          )}
          key={editHold.attempt}
          kind={'take-over'}
          onCancel={() => navigate(closeHref)}
          onConfirm={() => void editHold.takeOver()}
        />
      )}
      {editHold.state.status === 'own-other-tab' && (
        <EditHoldDialog
          content={'episode'}
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

          {/* The content left, the details right (27d, as 24a). */}
          <AdminDetailLayout>
            <AdminDetailMain>
              <fieldset className={styles.lock} disabled={isLocked}>
                {/* The field as the article's, the grey number after its
                    label; the field Číslo names it (27d, 1iqapiz2). */}
                <AdminTextarea
                  field={fields.title}
                  label={
                    <>
                      Název
                      {number !== null && (
                        <span aria-hidden={true} className={styles.number}>
                          #{number}
                        </span>
                      )}
                    </>
                  }
                  textareaProps={{
                    className: styles.titleInput,
                    onInput: handleTitleInput,
                    onKeyDown: handleTitleKeyDown,
                    rows: 1,
                  }}
                />
                <AdminTextarea
                  field={fields.description}
                  hint={
                    'Stručně popište epizodu. Na webu se popis zobrazí pod názvem.'
                  }
                  label={'Popis'}
                  textareaProps={{ className: styles.descriptionInput }}
                />
                <fieldset className={styles.links}>
                  <legend className={styles.linksLegend}>
                    Odkazy na epizodu
                  </legend>
                  <EpisodeLinks
                    isReadOnly={isReadOnly}
                    name={fields.links.name}
                  />
                </fieldset>
              </fieldset>
            </AdminDetailMain>

            <AdminDetailAside>
              <AdminDetailSection title={'Údaje'}>
                <dl className={styles.facts}>
                  <div className={styles.fact}>
                    <dt className={styles.factLabel}>Podcast</dt>
                    <dd>{podcast.title}</dd>
                  </div>
                  {/* Without its own cover the episode goes out with the
                      podcast's, shown muted; its own uploads as it is
                      picked (27d). */}
                  <div className={styles.fact}>
                    <dt className={styles.factLabel}>Obálka</dt>
                    <dd
                      aria-busy={coverUpload.isBusy || undefined}
                      className={styles.coverField}
                    >
                      {/* *Vybrat vlastní* and *Vyměnit* open it; a pick
                          saves on its own, never with the form. */}
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
                      <div className={styles.cover}>
                        {coverUpload.previewUrl !== null ? (
                          // The picked cover, dimmed until it saves.
                          <img
                            alt={''}
                            className={clsx(
                              styles.coverImage,
                              styles.coverUploading,
                            )}
                            src={coverUpload.previewUrl}
                          />
                        ) : episode.cover !== null ? (
                          <Image
                            {...episode.cover.sources}
                            alt={episode.cover.altText}
                            className={styles.coverImage}
                            sizes={'72px'}
                          />
                        ) : podcast.cover !== null ? (
                          <Image
                            {...podcast.cover.sources}
                            alt={''}
                            className={clsx(
                              styles.coverImage,
                              styles.coverMuted,
                            )}
                            sizes={'72px'}
                          />
                        ) : (
                          <span
                            className={clsx(
                              styles.coverImage,
                              styles.coverEmpty,
                            )}
                          />
                        )}
                        <div className={styles.coverText}>
                          {episode.cover === null && (
                            <span className={styles.secondary}>
                              Obálka podcastu
                            </span>
                          )}
                          {/* The picker keeps its place as its label changes,
                              so it keeps the focus too. */}
                          {!isReadOnly &&
                            renderCoverAction(
                              episode.cover === null
                                ? 'Vybrat vlastní'
                                : 'Vyměnit',
                              openCoverPicker,
                              firstCoverActionRef,
                            )}
                          {!isReadOnly &&
                            episode.cover !== null &&
                            renderCoverAction(
                              'Použít obálku podcastu',
                              () => void coverUpload.remove(),
                            )}
                        </div>
                      </div>
                      {!isReadOnly && (
                        <span className={styles.coverHint}>
                          Nepovinná. Obrázek do 5 MB. Nečtvercový se na webu
                          ořízne.
                        </span>
                      )}
                      {/* A refused pick, or a failed upload (26d). */}
                      {(coverUpload.rejection !== null ||
                        coverUpload.failure !== null) && (
                        <div
                          className={styles.coverProblem}
                          id={coverProblemId}
                        >
                          <ErrorMessage>
                            {coverUpload.failure?.sentence ??
                              coverUpload.rejection}
                          </ErrorMessage>
                          {coverUpload.failure?.canRetry &&
                            !isReadOnly &&
                            renderCoverAction(
                              'Zkusit znovu',
                              coverUpload.retry,
                            )}
                        </div>
                      )}
                    </dd>
                  </div>
                </dl>

                <fieldset className={styles.lock} disabled={isLocked}>
                  <div className={styles.fieldGroup}>
                    <TextField
                      {...getInputProps(fields.number, { type: 'text' })}
                      errors={numberErrors}
                      inputMode={'numeric'}
                      label={'Číslo'}
                    />
                    {/* A taken number: a free one, filled in and saved (27f). */}
                    {isNumberTaken && freeNumber !== null && !isReadOnly && (
                      <ButtonLink
                        className={styles.offer}
                        onClick={() => applyFreeNumber(freeNumber)}
                        type={'button'}
                      >
                        Použít {freeNumber}
                      </ButtonLink>
                    )}
                  </div>
                  <div className={styles.fieldGroup}>
                    <TextField
                      {...getInputProps(fields.slug, { type: 'text' })}
                      errors={fields.slug.errors}
                      // No hint while it follows the title (27d, tly4a163).
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
                      onBlur={handleSlugFieldBlur}
                      onFocus={handleSlugFocus}
                      onInput={handleSlugInput}
                    />
                    {/* A taken address: a free one, filled in and saved (27f). */}
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
                  {/* Only the Coordinator chooses the author (27d, as 25c). */}
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

                {/* What a reader sees, under a line, as 27d draws it. */}
                <dl className={styles.webPreview}>
                  <dt className={styles.webPreviewLabel}>Na webu jako</dt>
                  {webTitle !== null && <dd>{webTitle}</dd>}
                  {webSlug !== '' && (
                    <dd className={styles.tertiary}>
                      /podcasts/{podcast.slug}/{webSlug}
                    </dd>
                  )}
                </dl>
              </AdminDetailSection>
            </AdminDetailAside>
          </AdminDetailLayout>
        </Form>
      </FormProvider>
    </AdminPage>
  )
}
