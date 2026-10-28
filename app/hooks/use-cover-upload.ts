import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useRevalidator } from 'react-router'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { IMAGE_OVER_PIXEL_BUDGET_MESSAGE } from '~/config/image-variants-config'
import { useWaitForChange } from '~/hooks/use-wait-for-change'
import { getRejectedCoverSentence } from '~/utils/podcast/get-rejected-cover-sentence'

// Said under the field once an upload failed (copy yzyd9p1l).
const FAILED_UPLOAD_SENTENCE =
  'Zkuste soubor nahrát znovu — nahrání se nepovedlo.'
// Said once *Použít obálku podcastu* did not save, as the save line says it
// (24e, copy yzyd9p1l).
const FAILED_REMOVAL_SENTENCE = 'Nepodařilo se uložit.'

type Answer =
  | { status: 'saved'; updatedAt: string }
  | { status: 'failed'; reason?: 'over-pixel-budget' }
  | { status: 'cancelled' | 'unsaved' }

/** The cover uploading now. */
export type CoverUpload = {
  /** The picked cover, shown dimmed while it uploads. */
  previewUrl: string
  /** Whether a stored cover was there when it was picked. */
  replaces: boolean
  /** The stored cover when it was picked, which a crossed save changes. */
  keyAtPick: string | null
}

/** The last change that failed, until another pick or a retry. */
export type CoverUploadFailure = {
  /** What *Zkusit znovu* repeats. */
  change: 'upload' | 'remove'
  /** The picked file's name, which the failed field shows (26d); none for a removal. */
  fileName: string | null
  sentence: string
  /** The same change again: not for an image over the pixel budget. */
  canRetry: boolean
  /** A stored cover was there and stayed (26d). */
  replaces: boolean
}

type Options = {
  /** The cover route of the content, which saves one change at a time. */
  action: string
  /** The editor's tab, `null` until it holds the edit. */
  tabId: string | null
  /** The cover as loaded, which changes with every upload. */
  storedKey: string | null
  /** For a screen reader, once the content loaded again after a cancel. */
  cancelledAnnouncement: string
  /** As `cancelledAnnouncement`, for a cancelled cover that replaced none. */
  cancelledNewAnnouncement?: string
  /** For a screen reader, a cancel whose replacement had already saved. */
  crossedAnnouncement: string
  /** Refused for the hold: `true` when the editor took it back and may retry. */
  onNotHeld: (heldByName: string | null) => Promise<boolean>
  /** The content is gone (0036): the editor rechecks its hold. */
  onDeleted: () => Promise<void>
  /** The content's new `updatedAt` after a saved change. */
  onSaved: (updatedAt: string) => void
}

/**
 * A podcast's cover or an episode's own (design 27e, 27d): a picked image
 * goes on `fetch` at once, alone, as the issue's cover does (26c, log 0029),
 * and can be cancelled until it saves. A cancelled new cover is always sent a
 * removal too, because the abort loses an answer already on its way; a
 * replacement whose answer crossed the cancel stays, and the screen reader
 * hears so. The episode's *Použít obálku podcastu* removes its own. A failed
 * upload keeps its file for *Zkusit znovu*. The browser asks before the tab
 * closes during an upload.
 *
 * @param options - The cover route, the tab, the stored cover, what a screen
 *   reader hears after a cancel, and what the editor does with a refusal for
 *   the hold, deleted content and a save.
 * @returns The upload under way, whether a change is under way, the last
 *   failure, how many uploads failed, the sentence of a refused pick, whether
 *   a cancel still settles, the announcement, and `pick`, `retry`, `remove`,
 *   `cancel` and `abandon`.
 */
export const useCoverUpload = ({
  action,
  tabId,
  storedKey,
  cancelledAnnouncement,
  cancelledNewAnnouncement,
  crossedAnnouncement,
  onNotHeld,
  onDeleted,
  onSaved,
}: Options) => {
  const authenticityToken = useAuthenticityToken()
  const revalidator = useRevalidator()
  const optionsRef = useRef({ onDeleted, onNotHeld, onSaved, tabId })
  optionsRef.current = { onDeleted, onNotHeld, onSaved, tabId }
  const storedKeyRef = useRef(storedKey)
  storedKeyRef.current = storedKey
  // Read once a cancel has settled, which may be renders later.
  const announcementsRef = useRef({
    cancelledAnnouncement,
    cancelledNewAnnouncement,
    crossedAnnouncement,
  })
  announcementsRef.current = {
    cancelledAnnouncement,
    cancelledNewAnnouncement,
    crossedAnnouncement,
  }
  const waitForStoredCover = useWaitForChange(storedKey)

  // One change at a time.
  const isBusyRef = useRef(false)
  const [isBusy, setIsBusy] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)
  const uploadRef = useRef<CoverUpload | null>(null)
  const [upload, setUpload] = useState<CoverUpload | null>(null)
  const fileRef = useRef<File | null>(null)
  const [failure, setFailure] = useState<CoverUploadFailure | null>(null)
  const [failureCount, setFailureCount] = useState(0)
  const [rejection, setRejection] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  // Until a cancel has sent its removal and the content loaded again, so a
  // new pick cannot race it.
  const isCancellingRef = useRef(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const setBusy = (next: boolean) => {
    isBusyRef.current = next
    setIsBusy(next)
  }

  const showUpload = (next: CoverUpload | null) => {
    uploadRef.current = next
    setUpload(next)
  }

  const endUpload = () => {
    const current = uploadRef.current
    if (current !== null) URL.revokeObjectURL(current.previewUrl)
    controllerRef.current = null
    showUpload(null)
    setBusy(false)
  }

  // One change; a refusal for the hold goes once more after the editor takes
  // it back, like the whole-form save.
  const post = async (
    fields: Record<string, string | Blob>,
    signal?: AbortSignal,
    isRetry = false,
  ): Promise<Answer> => {
    const { tabId: currentTabId } = optionsRef.current
    if (currentTabId === null) return { status: 'unsaved' }
    if (signal?.aborted) return { status: 'cancelled' }

    const body = new FormData()
    body.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    body.append('editTabId', currentTabId)
    for (const [name, value] of Object.entries(fields)) body.append(name, value)

    let response: Response
    try {
      response = await fetch(action, { body, method: 'POST', signal })
    } catch {
      return { status: signal?.aborted ? 'cancelled' : 'unsaved' }
    }

    // An expired session redirects to the sign-in page.
    if (response.redirected) return { status: 'unsaved' }

    let answer:
      | Answer
      | { status: 'not-held'; heldByName: string | null }
      | { status: 'deleted' | 'invalid' }
    try {
      answer = await response.json()
    } catch {
      return { status: signal?.aborted ? 'cancelled' : 'unsaved' }
    }

    // Deleted meanwhile (0036): the hold learns it and the editor only reads.
    if (answer.status === 'deleted') {
      await optionsRef.current.onDeleted()
      return { status: 'unsaved' }
    }

    if (answer.status === 'not-held') {
      const mayRetry = await optionsRef.current.onNotHeld(answer.heldByName)
      return mayRetry && !isRetry
        ? post(fields, signal, true)
        : { status: 'unsaved' }
    }

    if (answer.status === 'saved') {
      optionsRef.current.onSaved(answer.updatedAt)
      return answer
    }

    // 422: the image did not process; anything else is no answer.
    return answer.status === 'failed' ? answer : { status: 'unsaved' }
  }

  // The change lasts until the stored cover has rendered: the revalidation
  // resolves before React shows its data, and ending earlier would show the
  // previous cover for a moment.
  const settle = async (answer: Answer, keyAtStart: string | null) => {
    if (answer.status !== 'saved') return
    await revalidator.revalidate()
    await waitForStoredCover(keyAtStart)
  }

  const send = async (file: File) => {
    const controller = new AbortController()
    controllerRef.current = controller
    const keyAtPick = storedKeyRef.current
    const replaces = keyAtPick !== null
    setBusy(true)
    fileRef.current = file
    setFailure(null)
    setRejection(null)
    setAnnouncement('')
    showUpload({ keyAtPick, previewUrl: URL.createObjectURL(file), replaces })
    const answer = await post({ file, intent: 'upload' }, controller.signal)
    if (!controller.signal.aborted) await settle(answer, keyAtPick)

    // A cancel settled it already, and its answer is lost.
    if (controller.signal.aborted || answer.status === 'cancelled') return

    endUpload()

    if (answer.status === 'saved') {
      fileRef.current = null
      return
    }

    const isOverPixelBudget =
      answer.status === 'failed' && answer.reason === 'over-pixel-budget'
    setFailureCount((count) => count + 1)
    setFailure({
      canRetry: !isOverPixelBudget,
      change: 'upload',
      fileName: file.name,
      replaces,
      sentence: isOverPixelBudget
        ? IMAGE_OVER_PIXEL_BUDGET_MESSAGE
        : FAILED_UPLOAD_SENTENCE,
    })
  }

  /** Uploads a picked file, unless it is refused at selection. */
  const pick = (file: File) => {
    if (isBusyRef.current || isCancellingRef.current) return
    const sentence = getRejectedCoverSentence(file)
    if (sentence !== null) {
      setFailure(null)
      setRejection(sentence)
      return
    }
    void send(file)
  }

  /** Repeats the failed change: the file once more, or the removal. */
  const retry = () => {
    if (failure?.change === 'remove') {
      void remove()
      return
    }
    const file = fileRef.current
    if (file === null || isBusyRef.current || isCancellingRef.current) return
    void send(file)
  }

  /** *Použít obálku podcastu*: the own cover goes. */
  const remove = async () => {
    if (isBusyRef.current || isCancellingRef.current) return
    setBusy(true)
    fileRef.current = null
    setFailure(null)
    setRejection(null)
    setAnnouncement('')

    const keyAtStart = storedKeyRef.current
    const answer = await post({ intent: 'remove' })
    await settle(answer, keyAtStart)
    setBusy(false)

    // The own cover stays on screen; the field says the click did not save.
    if (answer.status !== 'saved') {
      setFailure({
        canRetry: true,
        change: 'remove',
        fileName: null,
        replaces: true,
        sentence: FAILED_REMOVAL_SENTENCE,
      })
    }
  }

  /**
   * Stops the upload at any point until it saves; the stored cover, or none,
   * stays. Settles once the server has heard of it.
   */
  const cancel = async () => {
    const controller = controllerRef.current
    const current = uploadRef.current
    if (controller === null || current === null) return

    controller.abort()
    endUpload()
    fileRef.current = null
    isCancellingRef.current = true
    setIsCancelling(true)

    if (!current.replaces) await post({ intent: 'remove' })
    await revalidator.revalidate()
    isCancellingRef.current = false
    setIsCancelling(false)
    void announceCancel(current)
  }

  // The content has loaded again: say what stayed. A cancelled new cover is
  // always removed; a replacement whose answer crossed the cancel shows once
  // its cover has rendered, which a revalidation does not wait for, and the
  // editor does not wait for the announcement either.
  const announceCancel = async (current: CoverUpload) => {
    const {
      cancelledAnnouncement,
      cancelledNewAnnouncement,
      crossedAnnouncement,
    } = announcementsRef.current
    if (!current.replaces) {
      setAnnouncement(cancelledNewAnnouncement ?? cancelledAnnouncement)
      return
    }
    await waitForStoredCover(current.keyAtPick)
    setAnnouncement(
      storedKeyRef.current === current.keyAtPick
        ? cancelledAnnouncement
        : crossedAnnouncement,
    )
  }

  /**
   * Stops the upload for content that is gone (log 0036): there is nothing
   * to remove and nothing to load again.
   */
  const abandon = () => {
    const controller = controllerRef.current
    if (controller === null) return

    controller.abort()
    endUpload()
    fileRef.current = null
  }

  // A new cover whose answer never came may have landed after all: once the
  // content loads with it, the stored cover stands instead of the failure.
  useEffect(() => {
    if (storedKey === null) return
    setFailure((current) =>
      current?.change === 'upload' && !current.replaces ? null : current,
    )
  }, [storedKey])

  // An upload on its way is lost with the page; the browser asks.
  const handleBeforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (controllerRef.current === null) return
    event.preventDefault()
    event.returnValue = ''
  })
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) =>
      handleBeforeUnload(event)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // Gone with an upload under way (the dialog let it go): it is cancelled
  // like any other, a new cover with its removal.
  const handleUnmount = useEffectEvent(() => {
    const current = uploadRef.current
    if (current !== null) URL.revokeObjectURL(current.previewUrl)
    if (controllerRef.current === null || current === null) return
    controllerRef.current.abort()
    controllerRef.current = null
    if (!current.replaces) void post({ intent: 'remove' })
  })
  useEffect(() => () => handleUnmount(), [])

  return {
    abandon,
    announcement,
    cancel,
    failure,
    failureCount,
    isBusy,
    isCancelling,
    isUploading: upload !== null,
    pick,
    previewUrl: upload?.previewUrl ?? null,
    rejection,
    remove,
    retry,
    upload,
  }
}
