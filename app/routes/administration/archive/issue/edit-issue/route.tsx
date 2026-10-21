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
import { AdminDetailAside } from '~/components/admin/admin-detail-aside'
import { AdminDetailLayout } from '~/components/admin/admin-detail-layout'
import { AdminDetailMain } from '~/components/admin/admin-detail-main'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { ButtonLink } from '~/components/button-link'
import { CancelUploadDialog } from '~/components/cancel-upload-dialog'
import { ContentChangedDialog } from '~/components/content-changed-dialog'
import { EditHoldDialog } from '~/components/edit-hold-dialog'
import { ErrorMessage } from '~/components/error-message'
import { Form } from '~/components/form'
import { HoldTakenDialog } from '~/components/hold-taken-dialog'
import { Image } from '~/components/image'
import { Link } from '~/components/link'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { Select } from '~/components/select'
import { StatusTag } from '~/components/status-tag'
import { TextField } from '~/components/text-field'
import { UploadStatus } from '~/components/upload-status'
import { EDIT_HOLD_CONFIG } from '~/config/edit-hold-config'
import { FORM_CONFIG } from '~/config/form-config'
import { type AutosaveSendResult, useAutosave } from '~/hooks/use-autosave'
import { useEditHold } from '~/hooks/use-edit-hold'
import { isSaveShortcut } from '~/utils/autosave/is-save-shortcut'
import { formatTakeOverDescription } from '~/utils/edit-hold/format-take-over-description'
import { getReadOnlyNotice } from '~/utils/edit-hold/get-read-only-notice'
import {
  getIssueNumberSuggestion,
  type IssueNumberSuggestion,
} from '~/utils/issue/get-issue-number-suggestion'
import { getIssueTitle } from '~/utils/issue/get-issue-title'
import { getNextFreeIssueOrder } from '~/utils/issue/get-next-free-issue-order'
import { slugify } from '~/utils/slugify'
import { formatEditHoldLine } from '../../../articles/utils/format-edit-hold-line'
import { getEditedIssuePdfFileName } from '../../utils/get-edited-issue-pdf-file-name'
import type { IssueNumberConflict } from '../../utils/get-issue-number-conflict-message'
import { schema } from './_schema'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { FailedFile } from './components/failed-file'
import { FileDropField } from './components/file-drop-field'
import { formatIssueChangedDescription } from './utils/format-issue-changed-description'
import {
  formatIssueFilesSentence,
  type IssueFiles,
} from './utils/format-issue-files-sentence'
import { formatIssueHoldTakenDescription } from './utils/format-issue-hold-taken-description'
import { formatUnsavedIssueFields } from './utils/format-unsaved-issue-fields'
import { getIssueEditorSentence } from './utils/get-issue-editor-sentence'
import { getIssueSaveLineText } from './utils/get-issue-save-line-text'
import { getIssueWebPreview } from './utils/get-issue-web-preview'
import {
  FAILED_SENTENCE,
  ORIGINAL_STAYED_SENTENCE,
  ORIGINAL_STAYS_SENTENCE,
  UPLOADING_LINE,
  UPLOADING_SENTENCE,
} from './utils/issue-file-sentences'
import { useIssueFileUpload } from './utils/use-issue-file-upload'
import { useUploadFocus } from './utils/use-upload-focus'

export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

type NumberConflict = IssueNumberConflict & { freeOrder: number | null }

// What the save route answers (decisions 0022, 0034).
type SaveResponse =
  | {
      status: 'saved'
      updatedAt: string
      isNumberSaved: boolean
      numberConflict: NumberConflict | null
    }
  | { status: 'not-held'; heldByName: string | null }

// The name of the button Conform submits its intents with.
const CONFORM_INTENT_NAME = '__intent__'

// The tab's own fields are no change of the issue.
const SNAPSHOT_IGNORED_FIELDS = new Set<string>([
  FORM_CONFIG.authenticityToken.name,
  EDIT_HOLD_CONFIG.tabIdName,
])

// The details in the form's order, by the labels a list of unsent ones uses
// (copy ey73zhul).
const FIELD_LABELS = {
  authorId: 'Autor',
  name: 'Název',
  order: 'Pořadí v roce',
  supplement: 'Doplněk',
  year: 'Rok',
} as const

type FieldName = keyof typeof FIELD_LABELS
type FieldValues = Record<FieldName, string>

type NumberField = 'year' | 'order' | 'supplement'

// The closing sentence names the field whose change collided (design 26d).
const UNSAVED_NUMBER_CHANGE: Record<NumberField, string> = {
  order: 'Změna pořadí se neuložila.',
  supplement: 'Změna doplňku se neuložila.',
  year: 'Změna roku se neuložila.',
}

// What the editor says once the hold went elsewhere (24h, 24i): which dialog,
// and which details stayed unsent.
type HoldLoss = {
  dialog: 'taken' | 'changed' | null
  holderName: string
  unsentLabels: string[]
}

// A field's value in the form, read as the input holds it.
const readValues = (formData: FormData | null): Partial<FieldValues> => {
  if (formData === null) return {}
  const values: Partial<FieldValues> = {}
  for (const field of Object.keys(FIELD_LABELS) as FieldName[]) {
    const value = formData.get(field)
    if (typeof value === 'string') values[field] = value.trim()
  }
  return values
}

const parseNumber = (value: string | undefined) => {
  const number = Number(value)
  return value === undefined || value.trim() === '' || !Number.isInteger(number)
    ? null
    : number
}

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    authors,
    currentYear,
    isApprover,
    isOwn,
    issue,
    publishedNamesByNumber,
    takenOrdersByYear,
    visibleNamesByNumber,
  } = loaderData
  const navigate = useNavigate()
  const revalidator = useRevalidator()
  // The title the breadcrumb and the tab show, as last loaded.
  const loadedTitleRef = useRef(issue.title)
  loadedTitleRef.current = issue.title
  const formRef = useRef<HTMLFormElement>(null)
  const saveAction = href('/administration/archive/:issueId/save', {
    issueId: params.issueId,
  })

  // Autosave is set up after the hold; a closing page asks it through this.
  const leaveSaveRef = useRef<() => FormData | null>(() => null)

  // One tab edits at a time (07g, 24g).
  const editHold = useEditHold({
    action: href('/administration/archive/:issueId/edit-hold', {
      issueId: params.issueId,
    }),
    entity: 'issue',
    id: params.issueId,
    isEmpty: issue.isEmptyDraft,
    leaveSave: {
      action: saveAction,
      getFormData: () => leaveSaveRef.current(),
    },
    updatedAt: issue.updatedAt,
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
  const readOnlyNotice = getReadOnlyNotice(editHold.state, 'issue')
  // Changed meanwhile, and free to edit again here (24i).
  const canReloadChanged =
    editHold.state.status === 'changed' &&
    editHold.state.holder === null &&
    editHold.state.isEditable
  const [holdLoss, setHoldLoss] = useState<HoldLoss | null>(null)

  const closeHref = issue.isEmptyDraft
    ? href('/administration/archive')
    : href('/administration/archive/:issueId', { issueId: params.issueId })

  const loadedValues: FieldValues = {
    authorId: issue.authorId,
    name: issue.name,
    order: issue.order === null ? '' : String(issue.order),
    supplement: issue.supplement,
    year: issue.year === null ? '' : String(issue.year),
  }

  // A locked fieldset leaves the form's data, so the heading, the preview and
  // the list of unsent details keep the values the editor last showed (07g).
  const shownValuesRef = useRef(loadedValues)

  const [form, fields] = useForm({
    defaultValue: loadedValues,
    id: 'edit-issue',
    // Parsed here, so a year or an order that can't be read is said at its
    // field (copy xrtebq3m); the save leaves it out (decision 0034).
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldRevalidate: 'onInput',
    shouldValidate: 'onBlur',
  })

  // The issue's last save, as the line under the heading says it (24e). A new
  // draft has none until its first save.
  const [savedAt, setSavedAt] = useState(() =>
    issue.isEmptyDraft ? null : new Date(issue.updatedAt),
  )
  const lastSavedAtRef = useRef(issue.updatedAt)
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

  // A taken number, which did not save (26d), and the field the editor
  // changed last among the three that make it.
  const [numberConflict, setNumberConflict] = useState<NumberConflict | null>(
    null,
  )
  const lastNumberFieldRef = useRef<NumberField>('order')

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

    // A number taken or unread stayed as it was stored (decision 0034).
    const sentValues = readValues(formData)
    savedValuesRef.current = result.isNumberSaved
      ? sentValues
      : {
          ...sentValues,
          order: savedValuesRef.current.order,
          supplement: savedValuesRef.current.supplement,
          year: savedValuesRef.current.year,
        }
    acknowledgeSaved(result.updatedAt)
    setNumberConflict(result.numberConflict)

    // A new title reaches the breadcrumb and the tab title.
    const savedYear = parseNumber(savedValuesRef.current.year)
    const savedOrder = parseNumber(savedValuesRef.current.order)
    const savedTitle = getIssueTitle(
      {
        name: savedValuesRef.current.name || null,
        order: savedOrder,
        supplement: savedValuesRef.current.supplement || null,
        year: savedYear,
      },
      visibleNamesByNumber[`${savedYear}/${savedOrder}`] ?? null,
    )
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

  // The cover and the PDF: each saves on its own as it is picked (26c,
  // decision 0029). Refused for the hold: as the whole-form save does (24h,
  // 24i).
  const filesAction = href('/administration/archive/:issueId/files', {
    issueId: params.issueId,
  })
  const handleFileNotHeld = async (heldByName: string | null) => {
    if (heldByName === null) return editHold.retake()
    await editHold.recheck()
    return false
  }
  const coverUpload = useIssueFileUpload({
    action: filesAction,
    hasFile: issue.cover !== null,
    kind: 'cover',
    onNotHeld: handleFileNotHeld,
    onSaved: acknowledgeSaved,
    storedKey: issue.cover?.sources.src ?? null,
    tabId: editHold.tabId,
  })
  const pdfUpload = useIssueFileUpload({
    action: filesAction,
    hasFile: issue.pdf !== null,
    kind: 'pdf',
    onNotHeld: handleFileNotHeld,
    onSaved: acknowledgeSaved,
    storedKey: issue.pdf?.id ?? null,
    tabId: editHold.tabId,
  })
  const uploadingFiles: IssueFiles = {
    cover: coverUpload.isUploading,
    pdf: pdfUpload.isUploading,
  }
  const coverInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLElement>(null)
  const pdfRef = useRef<HTMLElement>(null)
  useUploadFocus(coverUpload.isUploading, coverRef)
  useUploadFocus(pdfUpload.isUploading, pdfRef)
  // A refused pick's sentence describes its field (26d).
  const rejectionIds = { cover: useId(), pdf: useId() }

  // The labels of the details that differ from this editor's last save; the
  // author only where the editor chooses it.
  const getUnsentLabels = () =>
    (Object.keys(FIELD_LABELS) as FieldName[])
      .filter(
        (field) =>
          (field !== 'authorId' || authors !== null) &&
          shownValuesRef.current[field].trim() !==
            (savedValuesRef.current[field] ?? ''),
      )
      .map((field) => FIELD_LABELS[field])

  // The hold went elsewhere: nothing more goes out, and the editor says
  // which details stayed unsent (24h, 24i).
  const handleHoldLoss = useEffectEvent(async () => {
    const { state } = editHold
    if (state.status !== 'lost' && state.status !== 'changed') return

    const hasUnsentChanges = await autosave.stop()
    const unsentLabels = hasUnsentChanges ? getUnsentLabels() : []
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
  // Set by Použít N, whose change saves at once instead of after the pause.
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
  // first while a file uploads (26c, bxy8xxqs). The dialog names the
  // failures from its opening on (moo05ljj). Both counts are kept here, read
  // ahead of a render.
  const uploadingCountRef = useRef(0)
  uploadingCountRef.current =
    Number(coverUpload.isUploading) + Number(pdfUpload.isUploading)
  const [pendingLeave, setPendingLeave] = useState<{
    to: string
    go: () => void
    stay: () => void
    failureCountsAtOpen: Record<keyof IssueFiles, number>
  } | null>(null)
  const askBeforeLeaving = (
    to: string,
    go: () => void,
    stay: () => void = () => {},
  ) =>
    setPendingLeave({
      failureCountsAtOpen: {
        cover: coverUpload.failureCount,
        pdf: pdfUpload.failureCount,
      },
      go,
      stay,
      to,
    })
  // The dialog's leave cancels what still uploads, and goes once the server
  // has heard of it; once none runs it only closes.
  const leaveDespiteUploads = () => {
    if (pendingLeave === null) return
    const cancelled = Promise.all([coverUpload.cancel(), pdfUpload.cancel()])
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

  // Nothing posts the form: Enter in a field saves at once. Conform runs its
  // own `update` as a submit (the order following the year, Použít N); that
  // waits for the pause like typing.
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

  // The order follows the year with the next free one until the editor sets
  // it, and never for a supplement, which takes its issue's order (26c).
  const isOrderFollowingRef = useRef(
    issue.supplement === '' &&
      issue.year !== null &&
      issue.order ===
        getNextFreeIssueOrder(takenOrdersByYear[issue.year] ?? []),
  )
  const handleYearInput = () => {
    lastNumberFieldRef.current = 'year'
    const input = formRef.current?.elements.namedItem(fields.year.name)
    const year = parseNumber(
      input instanceof HTMLInputElement ? input.value : undefined,
    )
    if (
      !isOrderFollowingRef.current ||
      (fields.supplement.value ?? '') !== '' ||
      year === null
    ) {
      return
    }
    form.update({
      name: fields.order.name,
      value: String(getNextFreeIssueOrder(takenOrdersByYear[year] ?? [])),
    })
  }
  const handleOrderInput = () => {
    lastNumberFieldRef.current = 'order'
    isOrderFollowingRef.current = false
  }
  const handleSupplementInput = () => {
    lastNumberFieldRef.current = 'supplement'
  }

  const isLocked = !isHolding
  const isReadOnly = lostHold !== null

  if (!isLocked) {
    shownValuesRef.current = {
      authorId: fields.authorId.value ?? '',
      name: fields.name.value ?? '',
      order: fields.order.value ?? '',
      supplement: fields.supplement.value ?? '',
      year: fields.year.value ?? '',
    }
  }
  const shownValues = shownValuesRef.current

  const year = parseNumber(shownValues.year)
  const order = parseNumber(shownValues.order)
  const name = shownValues.name.trim() || null
  const supplement = shownValues.supplement.trim() || null
  const number = `${year}/${order}`

  const title = getIssueTitle(
    { name, order, supplement, year },
    visibleNamesByNumber[number] ?? null,
  )
  // The name the PDF gets with the number shown; `null` without it (0033).
  const editedPdfFileName = getEditedIssuePdfFileName(
    {
      order: issue.order,
      pdfFileName: issue.pdf?.fileName ?? null,
      state: issue.state,
      supplementSlug: issue.supplementSlug,
      year: issue.year,
    },
    {
      order,
      supplementSlug: supplement === null ? '' : slugify(supplement),
      year,
    },
  )
  const webPreview = getIssueWebPreview({
    name,
    order,
    pdfFileName: editedPdfFileName,
    publishedMainIssueName: publishedNamesByNumber[number] ?? null,
    supplement,
    year,
  })

  const saveLine = getIssueSaveLineText({
    now,
    savedAt,
    // Without the hold nothing goes out: the line says the last save (24h).
    status:
      !isHolding &&
      (autosave.status === 'pending' || autosave.status === 'saving')
        ? 'idle'
        : autosave.status,
  })

  // The files have their own words beside it (26c, 26j).
  const uploadingLine = formatIssueFilesSentence(uploadingFiles, UPLOADING_LINE)

  // The only sign of saving, without a toast (24e); while only reading, who
  // edits it now, or that it is free again (24h).
  const renderSaveLine = () =>
    lostHold !== null && lostHold.holder !== null ? (
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
        Číslo lze znovu upravovat
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
      <p className={styles.saveLine}>
        {uploadingLine === null ? saveLine : `${saveLine} · ${uploadingLine}`}
      </p>
    )

  const editorSentence = getIssueEditorSentence({
    isOwn,
    isSubmitted: issue.submission !== null,
  })

  // A taken number at its field (26d): the issue that has it, as a link when
  // the editor may see it, and the change that did not save.
  const renderNumberConflict = (field: NumberConflict['field']) => {
    if (numberConflict === null || numberConflict.field !== field) return null

    const { before, holder, after } = numberConflict

    return [
      <>
        {before}
        {holder.id === null ? (
          holder.label
        ) : (
          <Link
            to={href('/administration/archive/:issueId', {
              issueId: holder.id,
            })}
          >
            {holder.label}
          </Link>
        )}
        {after} {UNSAVED_NUMBER_CHANGE[lastNumberFieldRef.current]}
      </>,
    ]
  }

  // A value that can't be read leaves the number unsaved (decision 0034). One
  // error says so, for the field changed last (copy zuq3hyhf): under that
  // field, or under the first one that can't be read when it reads well.
  const numberErrors: Record<NumberField, string[] | undefined> = {
    order: fields.order.errors,
    supplement: fields.supplement.errors,
    year: fields.year.errors,
  }
  const closingField: NumberField | undefined =
    numberErrors[lastNumberFieldRef.current] !== undefined
      ? lastNumberFieldRef.current
      : (['year', 'order', 'supplement'] as const).find(
          (field) => numberErrors[field] !== undefined,
        )
  const withUnsavedChange = (field: NumberField) =>
    field === closingField
      ? numberErrors[field]?.map(
          (error) =>
            `${error} ${UNSAVED_NUMBER_CHANGE[lastNumberFieldRef.current]}`,
        )
      : numberErrors[field]

  // The button goes once its value is in, so the focus moves to the field
  // that got the value last, not to the top of the page (26c).
  const focusNumberField = (field: 'year' | 'order') => {
    const input = formRef.current?.elements.namedItem(fields[field].name)
    if (input instanceof HTMLInputElement) input.focus()
  }

  // A free order for a taken one: filled in and saved (26d, as 24d).
  const freeOrder =
    numberConflict?.field === 'order' ? numberConflict.freeOrder : null
  const applyFreeOrder = (value: number) => {
    isOrderFollowingRef.current = false
    lastNumberFieldRef.current = 'order'
    form.update({ name: fields.order.name, value: String(value) })
    isFlushOnChangeRef.current = true
    focusNumberField('order')
  }

  // A new issue has no number until one is confirmed: the next free one is
  // offered, filled in and saved on a click (decision 0034, design 26c).
  const numberSuggestion = getIssueNumberSuggestion({
    currentYear,
    order: shownValues.order,
    supplement: shownValues.supplement,
    takenOrdersByYear,
    year: shownValues.year,
  })
  const applyNumberSuggestion = (suggestion: IssueNumberSuggestion) => {
    if (suggestion.kind !== 'order') {
      form.update({ name: fields.year.name, value: String(suggestion.year) })
    }
    if (suggestion.kind === 'year') {
      lastNumberFieldRef.current = 'year'
    } else {
      lastNumberFieldRef.current = 'order'
      // A computed order follows the year, as one set by the year does.
      isOrderFollowingRef.current = true
      form.update({ name: fields.order.name, value: String(suggestion.order) })
    }
    isFlushOnChangeRef.current = true
    focusNumberField(suggestion.kind === 'year' ? 'year' : 'order')
  }

  // The line under Rok and Pořadí v roce: a free order for a taken number
  // first, then the offer with what it offers (26c, 26d).
  const renderNumberOffer = () => {
    if (isReadOnly) return null

    if (freeOrder !== null) {
      return (
        <ButtonLink onClick={() => applyFreeOrder(freeOrder)} type={'button'}>
          Použít {freeOrder}
        </ButtonLink>
      )
    }

    if (numberSuggestion === null) return null

    // Copy k5m0j1ag: „Další“ continues after the last order without hinting
    // at a gap; „Rok:“ stays true in an editor left open over New Year.
    const { intro, value } =
      numberSuggestion.kind === 'number'
        ? {
            intro: 'Další číslo:',
            value: `${numberSuggestion.order}/${numberSuggestion.year}`,
          }
        : numberSuggestion.kind === 'order'
          ? {
              intro: `Další pořadí pro rok ${numberSuggestion.year}:`,
              value: String(numberSuggestion.order),
            }
          : { intro: 'Rok:', value: String(numberSuggestion.year) }

    return (
      <>
        <span className={styles.numberOfferIntro}>{intro}</span>
        <ButtonLink
          onClick={() => applyNumberSuggestion(numberSuggestion)}
          type={'button'}
        >
          Použít {value}
        </ButtonLink>
      </>
    )
  }

  // What still uploads and what stays (26c); once none runs, how it ended
  // (copy 2j4knkrm).
  const renderLeaveDialog = ({
    failureCountsAtOpen,
  }: NonNullable<typeof pendingLeave>) => {
    const isUploading = coverUpload.isUploading || pdfUpload.isUploading
    const replacingFiles: IssueFiles = {
      cover: coverUpload.upload?.replaces ?? false,
      pdf: pdfUpload.upload?.replaces ?? false,
    }
    const failedFiles: IssueFiles = {
      cover: coverUpload.failureCount > failureCountsAtOpen.cover,
      pdf: pdfUpload.failureCount > failureCountsAtOpen.pdf,
    }
    const failedReplacements: IssueFiles = {
      cover: failedFiles.cover && (coverUpload.failure?.replaces ?? false),
      pdf: failedFiles.pdf && (pdfUpload.failure?.replaces ?? false),
    }
    const kept = isUploading
      ? formatIssueFilesSentence(replacingFiles, ORIGINAL_STAYS_SENTENCE)
      : formatIssueFilesSentence(failedReplacements, ORIGINAL_STAYED_SENTENCE)

    return (
      <CancelUploadDialog
        isUploading={isUploading}
        onLeave={leaveDespiteUploads}
        onStay={stayDespiteUploads}
      >
        <AdminModalDescription>
          {isUploading
            ? formatIssueFilesSentence(uploadingFiles, UPLOADING_SENTENCE)
            : (formatIssueFilesSentence(failedFiles, FAILED_SENTENCE) ??
              'Nahrávání je dokončeno.')}
        </AdminModalDescription>
        {kept !== null && <AdminModalDescription>{kept}</AdminModalDescription>}
      </CancelUploadDialog>
    )
  }

  // Under a field: a refused pick, or a failed upload with what to do next
  // (26d). A failed replacement keeps the stored file above it.
  const renderFileProblem = (
    kind: keyof IssueFiles,
    failedFileName: string,
  ) => {
    const fileUpload = kind === 'cover' ? coverUpload : pdfUpload
    const inputRef = kind === 'cover' ? coverInputRef : pdfInputRef
    if (fileUpload.failure === null) {
      return (
        fileUpload.rejection !== null && (
          <div id={rejectionIds[kind]}>
            <ErrorMessage>{fileUpload.rejection}</ErrorMessage>
          </div>
        )
      )
    }
    const { failure } = fileUpload
    return (
      <FailedFile fileName={failedFileName}>
        <ErrorMessage>{failure.sentence}</ErrorMessage>
        {failure.replaces && (
          <p className={styles.uploaded}>{ORIGINAL_STAYED_SENTENCE[kind]}</p>
        )}
        {!isLocked && !fileUpload.isCancelling && (
          <div className={styles.fileActions}>
            {failure.canRetry && (
              <ButtonLink onClick={fileUpload.retry} type={'button'}>
                Zkusit znovu
              </ButtonLink>
            )}
            <ButtonLink
              onClick={() => inputRef.current?.click()}
              type={'button'}
            >
              Vybrat jiný soubor
            </ButtonLink>
          </div>
        )}
      </FailedFile>
    )
  }

  // Úpravu přebírá … in its paragraphs (26l).
  const [holdTakenLead = '', ...holdTakenRest] =
    holdLoss?.dialog === 'taken'
      ? formatIssueHoldTakenDescription({
          now,
          savedAt: hasSaved ? savedAt : null,
          unsentLabels: holdLoss.unsentLabels,
        })
      : []

  return (
    <AdminPage>
      <header className={styles.header}>
        <div className={styles.title}>
          <div className={styles.titleLine}>
            <PageTitle>{title}</PageTitle>
            <StatusTag state={issue.submission?.state ?? 'draft'} />
          </div>
          {renderSaveLine()}
        </div>
        {/* Sends what waits, then leaves (24e). */}
        <LinkButton onClick={handleClose} to={closeHref} variant={'outline'}>
          Zavřít
        </LinkButton>
      </header>

      {editorSentence !== null && (
        <p className={styles.sentence}>{editorSentence}</p>
      )}

      {readOnlyNotice !== null && (
        <AdminParagraph>{readOnlyNotice}</AdminParagraph>
      )}

      {pendingLeave !== null && renderLeaveDialog(pendingLeave)}

      {holdLoss?.dialog === 'taken' && (
        <HoldTakenDialog
          description={holdTakenLead}
          holderName={holdLoss.holderName}
          onOpenDetail={() => navigate(closeHref)}
          onStay={closeHoldLossDialog}
        >
          {holdTakenRest.map((paragraph) => (
            <AdminModalDescription key={paragraph}>
              {paragraph}
            </AdminModalDescription>
          ))}
          {holdLoss.unsentLabels.length > 0 && (
            <AdminModalDescription>
              Před otevřením detailu si poznamenejte neuložené údaje.
            </AdminModalDescription>
          )}
        </HoldTakenDialog>
      )}
      {holdLoss?.dialog === 'changed' &&
        editHold.state.status === 'changed' && (
          <ContentChangedDialog
            canReload={canReloadChanged}
            description={formatIssueChangedDescription({
              awayMilliseconds: editHold.state.awayMilliseconds,
              now: new Date(),
              savedAt: hasSaved ? savedAt : null,
            })}
            onClose={closeHoldLossDialog}
            onOpenDetail={() => navigate(closeHref)}
            onReload={reload}
            title={'Číslo se mezitím změnilo'}
          >
            <AdminModalDescription>
              {formatUnsavedIssueFields(holdLoss.unsentLabels)}
            </AdminModalDescription>
            <AdminModalDescription>
              {canReloadChanged
                ? 'Před načtením aktuální verze si poznamenejte neuložené údaje.'
                : 'Před otevřením detailu si poznamenejte neuložené údaje.'}
            </AdminModalDescription>
          </ContentChangedDialog>
        )}

      {/* Someone else's edit, only the Coordinator's to take (24g). */}
      {editHold.state.status === 'held-by-other' && isApprover && (
        <EditHoldDialog
          content={'issue'}
          description={formatTakeOverDescription(
            editHold.state.holder,
            new Date(),
            'issue',
          )}
          key={editHold.attempt}
          kind={'take-over'}
          onCancel={() => navigate(closeHref)}
          onConfirm={() => void editHold.takeOver()}
        />
      )}
      {editHold.state.status === 'own-other-tab' && (
        <EditHoldDialog
          content={'issue'}
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

          {/* The files left, the details right, as on the detail (26b, 26c). */}
          <AdminDetailLayout>
            <AdminDetailMain>
              <AdminDetailSection title={'Soubory'}>
                <div className={styles.files}>
                  {/* *Nahradit* and *Vybrat jiný soubor* open these. */}
                  <input
                    accept={'image/*'}
                    form={''}
                    hidden
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0]
                      event.currentTarget.value = ''
                      if (file !== undefined) coverUpload.pick(file)
                    }}
                    ref={coverInputRef}
                    type={'file'}
                  />
                  <input
                    accept={'application/pdf'}
                    form={''}
                    hidden
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0]
                      event.currentTarget.value = ''
                      if (file !== undefined) pdfUpload.pick(file)
                    }}
                    ref={pdfInputRef}
                    type={'file'}
                  />

                  <figure className={styles.cover} ref={coverRef}>
                    {coverUpload.upload?.previewUrl ? (
                      // The picked cover, dimmed until it saves; the stored
                      // one stays with the issue meanwhile (26c).
                      <img
                        alt={''}
                        className={clsx(styles.coverImage, styles.uploading)}
                        src={coverUpload.upload.previewUrl}
                      />
                    ) : coverUpload.failure !== null &&
                      !coverUpload.failure.replaces ? (
                      renderFileProblem('cover', coverUpload.failure.fileName)
                    ) : issue.cover === null ? (
                      <>
                        <FileDropField
                          accept={'image/*'}
                          errorId={
                            coverUpload.rejection === null
                              ? undefined
                              : rejectionIds.cover
                          }
                          hint={'nebo ji sem přetáhněte · obrázek do 5 MB'}
                          isDisabled={isLocked || coverUpload.isCancelling}
                          isPage
                          label={'Vybrat obálku'}
                          onPick={coverUpload.pick}
                        />
                        {renderFileProblem('cover', '')}
                      </>
                    ) : (
                      <>
                        <Image
                          {...issue.cover.sources}
                          alt={issue.cover.altText}
                          className={styles.coverImage}
                          sizes={'(width >= 40rem) 220px, 100vw'}
                        />
                        {renderFileProblem(
                          'cover',
                          coverUpload.failure?.fileName ?? '',
                        )}
                      </>
                    )}
                    {/* The row and *Nahradit* take one slot, so the caption
                        stays put when the upload ends. */}
                    {coverUpload.upload !== null ? (
                      <UploadStatus
                        cancelLabel={'Zrušit nahrávání obálky'}
                        onCancel={() => void coverUpload.cancel()}
                      />
                    ) : (
                      issue.cover !== null &&
                      !coverUpload.failure?.replaces &&
                      !isLocked &&
                      !coverUpload.isCancelling && (
                        <div className={styles.fileActions}>
                          <ButtonLink
                            onClick={() => coverInputRef.current?.click()}
                            type={'button'}
                          >
                            Nahradit
                          </ButtonLink>
                        </div>
                      )
                    )}
                    <figcaption className={styles.caption}>Obálka</figcaption>
                    <span className={'screen-reader-only'} role={'status'}>
                      {coverUpload.announcement}
                    </span>
                  </figure>

                  {/* The PDF card as on the detail (26b); without a PDF the
                      dashed field stands in it (26c, 26d). */}
                  <article className={styles.pdf} ref={pdfRef}>
                    <h3 className={styles.caption}>PDF</h3>
                    {pdfUpload.upload !== null ? (
                      <>
                        {/* The name it gets, by the number (26c). */}
                        <p className={styles.pdfName}>
                          {issue.pdf?.fileName ??
                            editedPdfFileName ??
                            pdfUpload.upload.fileName}
                        </p>
                        <p className={styles.uploaded}>
                          vybráno jako {pdfUpload.upload.fileName}
                        </p>
                        <UploadStatus
                          cancelLabel={'Zrušit nahrávání PDF'}
                          onCancel={() => void pdfUpload.cancel()}
                        />
                      </>
                    ) : pdfUpload.failure !== null &&
                      !pdfUpload.failure.replaces ? (
                      renderFileProblem(
                        'pdf',
                        editedPdfFileName ?? pdfUpload.failure.fileName,
                      )
                    ) : issue.pdf === null ? (
                      <>
                        <FileDropField
                          accept={'application/pdf'}
                          errorId={
                            pdfUpload.rejection === null
                              ? undefined
                              : rejectionIds.pdf
                          }
                          hint={'nebo ho sem přetáhněte · nejvýš 10 MB'}
                          isDisabled={isLocked || pdfUpload.isCancelling}
                          label={'Vybrat PDF'}
                          onPick={pdfUpload.pick}
                        />
                        {renderFileProblem('pdf', '')}
                      </>
                    ) : (
                      <>
                        {/* Without its name, before the year and order, the
                            name it was uploaded under (decision 0033). */}
                        <p className={styles.pdfName}>
                          {issue.pdf.fileName ?? issue.pdf.originalFileName}
                        </p>
                        <p className={styles.uploaded}>
                          nahráno {issue.pdf.uploadedAt}
                          {issue.pdf.fileName !== null &&
                            issue.pdf.originalFileName !== null && (
                              <> jako {issue.pdf.originalFileName}</>
                            )}
                        </p>
                        {!isLocked &&
                          !pdfUpload.failure?.replaces &&
                          !pdfUpload.isCancelling && (
                            <div className={styles.fileActions}>
                              <ButtonLink
                                onClick={() => pdfInputRef.current?.click()}
                                type={'button'}
                              >
                                Nahradit
                              </ButtonLink>
                            </div>
                          )}
                        {renderFileProblem(
                          'pdf',
                          pdfUpload.failure?.fileName ?? '',
                        )}
                      </>
                    )}
                    <span className={'screen-reader-only'} role={'status'}>
                      {pdfUpload.announcement}
                    </span>
                  </article>
                </div>
              </AdminDetailSection>
            </AdminDetailMain>

            <AdminDetailAside>
              <AdminDetailSection title={'Údaje'}>
                <fieldset className={styles.lock} disabled={isLocked}>
                  <div className={styles.numberGroup}>
                    <div className={styles.number}>
                      <TextField
                        {...getInputProps(fields.year, { type: 'text' })}
                        errors={withUnsavedChange('year')}
                        inputMode={'numeric'}
                        label={'Rok'}
                        onInput={handleYearInput}
                      />
                      <TextField
                        {...getInputProps(fields.order, { type: 'text' })}
                        errors={
                          renderNumberConflict('order') ??
                          withUnsavedChange('order')
                        }
                        inputMode={'numeric'}
                        label={'Pořadí v roce'}
                        onInput={handleOrderInput}
                      />
                    </div>
                    <div className={styles.numberOffer}>
                      {renderNumberOffer()}
                    </div>
                  </div>
                  <TextField
                    {...getInputProps(fields.name, { type: 'text' })}
                    errors={fields.name.errors}
                    hint={'Bez roku. Rok se k názvu přidá automaticky.'}
                    label={'Název'}
                  />
                  <TextField
                    {...getInputProps(fields.supplement, { type: 'text' })}
                    errors={
                      renderNumberConflict('supplement') ??
                      withUnsavedChange('supplement')
                    }
                    hint={
                      'Název samostatně vytištěné části, která se do čísla nevešla. Zadejte rok a pořadí čísla, ke kterému patří.'
                    }
                    label={'Doplněk'}
                    onInput={handleSupplementInput}
                    placeholder={'Nepovinné'}
                  />
                  {/* Only the Coordinator chooses the author (26c, as 25c). */}
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

                {/* What a reader sees, under a line, as 26c draws it. */}
                <dl className={styles.webPreview}>
                  <dt className={styles.webPreviewLabel}>Na webu jako</dt>
                  {webPreview.title !== null && (
                    <dd>
                      {webPreview.title}
                      {webPreview.orderLabel !== null && (
                        <span className={styles.tertiary}>
                          {' '}
                          · {webPreview.orderLabel}
                        </span>
                      )}
                    </dd>
                  )}
                  {webPreview.address !== null && (
                    <dd className={styles.tertiary}>{webPreview.address}</dd>
                  )}
                  {webPreview.missingNote !== null && (
                    <dd className={styles.tertiary}>
                      {webPreview.missingNote}
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
