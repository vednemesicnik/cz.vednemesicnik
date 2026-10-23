import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useRevalidator } from 'react-router'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { IMAGE_OVER_PIXEL_BUDGET_MESSAGE } from '~/config/image-variants-config'

import type { IssueFileKind } from '../../issue-files/_schema'
import { getRejectedIssueFileSentence } from './get-rejected-issue-file-sentence'
import { CANCEL_CROSSED_ANNOUNCEMENT } from './issue-file-sentences'

// Said under the field once an upload failed (copy yzyd9p1l).
const FAILED_UPLOAD_SENTENCE =
  'Zkuste soubor nahrát znovu — nahrání se nepovedlo.'
// Said once the issue has loaded again after a cancel (fmsjg9oc).
const CANCELLED_ANNOUNCEMENT = 'Nahrávání zrušeno.'

type Answer =
  | { status: 'saved'; updatedAt: string }
  | { status: 'failed'; reason?: 'over-pixel-budget' }
  | { status: 'cancelled' | 'unsaved' }

/** The file uploading now. */
export type IssueFileUpload = {
  /** The picked file's name: *vybráno jako …* (26c). */
  fileName: string
  /** The picked cover, shown dimmed while it uploads; `null` for a PDF. */
  previewUrl: string | null
  /** Whether a stored file was there when it was picked. */
  replaces: boolean
}

/** The last upload that failed, until another pick or a retry. */
export type IssueFileFailure = {
  fileName: string
  sentence: string
  /** The same file again: not for one the server refuses for its size. */
  canRetry: boolean
  /** The stored file stayed: *Původní … zůstalo u čísla.* (26d). */
  replaces: boolean
}

type Options = {
  kind: IssueFileKind
  /** The editor's files route. */
  action: string
  /** The editor's tab, `null` until it holds the edit. */
  tabId: string | null
  /** Whether the issue has the file now. */
  hasFile: boolean
  /** The stored file as loaded, which changes with every upload. */
  storedKey: string | null
  /** Refused for the hold: `true` when the editor took it back and may retry. */
  onNotHeld: (heldByName: string | null) => Promise<boolean>
  /** The issue's new `updatedAt` after a saved upload. */
  onSaved: (updatedAt: string) => void
}

/**
 * The upload of the issue's cover or PDF (design 26c, 26d, log 0029): it
 * goes on `fetch` as soon as it is picked, alone, and can be cancelled until it
 * saves. A cancelled new file is always sent a removal too, because the abort
 * loses an answer already on its way; a replacement whose answer crossed the
 * cancel stays, and the screen reader hears so. A failed upload keeps its file
 * for *Zkusit znovu*. The browser asks before the tab closes during an upload.
 *
 * @param options - Which file, the route, the tab, the stored file, and what
 *   the editor does with a refusal for the hold and with a save.
 * @returns The upload under way, the last failure, the sentence of a refused
 *   pick, how many uploads failed, whether a cancel still settles, the
 *   announcement, and `pick`, `retry` and `cancel`.
 */
export const useIssueFileUpload = ({
  kind,
  action,
  tabId,
  hasFile,
  storedKey,
  onNotHeld,
  onSaved,
}: Options) => {
  const authenticityToken = useAuthenticityToken()
  const revalidator = useRevalidator()
  const optionsRef = useRef({ action, onNotHeld, onSaved, tabId })
  optionsRef.current = { action, onNotHeld, onSaved, tabId }
  const storedKeyRef = useRef(storedKey)
  storedKeyRef.current = storedKey
  // Settles a saved upload once the stored file has rendered.
  const settleRef = useRef<{
    keyAtPick: string | null
    settle: () => void
  } | null>(null)

  const controllerRef = useRef<AbortController | null>(null)
  const uploadRef = useRef<IssueFileUpload | null>(null)
  const fileRef = useRef<File | null>(null)
  const [upload, setUpload] = useState<IssueFileUpload | null>(null)
  const [failure, setFailure] = useState<IssueFileFailure | null>(null)
  const [failureCount, setFailureCount] = useState(0)
  const [rejection, setRejection] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  // Until a cancel has sent its removal and the issue loaded again, so a new
  // pick cannot race it.
  const isCancellingRef = useRef(false)
  const [isCancelling, setIsCancelling] = useState(false)
  // A cancelled upload, until the issue has loaded again.
  const [cancelledFrom, setCancelledFrom] = useState<{
    storedKey: string | null
  } | null>(null)

  const showUpload = (next: IssueFileUpload | null) => {
    uploadRef.current = next
    setUpload(next)
  }

  const endUpload = () => {
    const current = uploadRef.current
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl)
    controllerRef.current = null
    showUpload(null)
  }

  // One change; a refusal for the hold goes once more after the editor takes
  // it back, like the whole-form save.
  const post = async (
    fields: Record<string, string | Blob>,
    signal?: AbortSignal,
    isRetry = false,
  ): Promise<Answer> => {
    const { action: currentAction, tabId: currentTabId } = optionsRef.current
    if (currentTabId === null) return { status: 'unsaved' }
    if (signal?.aborted) return { status: 'cancelled' }

    const body = new FormData()
    body.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    body.append('editTabId', currentTabId)
    body.append('kind', kind)
    for (const [name, value] of Object.entries(fields)) body.append(name, value)

    let response: Response
    try {
      response = await fetch(currentAction, { body, method: 'POST', signal })
    } catch {
      return { status: signal?.aborted ? 'cancelled' : 'unsaved' }
    }

    // An expired session redirects to the sign-in page.
    if (response.redirected) return { status: 'unsaved' }

    let answer:
      | Answer
      | { status: 'not-held'; heldByName: string | null }
      | { status: 'invalid' }
    try {
      answer = await response.json()
    } catch {
      return { status: signal?.aborted ? 'cancelled' : 'unsaved' }
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

    // 422: the file did not process; anything else is no answer.
    return answer.status === 'failed' ? answer : { status: 'unsaved' }
  }

  const send = async (file: File, replaces: boolean) => {
    const controller = new AbortController()
    controllerRef.current = controller
    fileRef.current = file
    setFailure(null)
    setRejection(null)
    setAnnouncement('')
    showUpload({
      fileName: file.name,
      previewUrl: kind === 'cover' ? URL.createObjectURL(file) : null,
      replaces,
    })

    const keyAtPick = storedKeyRef.current
    const answer = await post({ file, intent: 'upload' }, controller.signal)

    // The upload lasts until the stored file has rendered: the revalidation
    // resolves before React shows its data, and ending earlier would show the
    // empty field for a moment. The same file again keeps its key, hence the
    // limit.
    if (answer.status === 'saved' && !controller.signal.aborted) {
      await revalidator.revalidate()
      if (storedKeyRef.current === keyAtPick) {
        await new Promise<void>((resolve) => {
          settleRef.current = { keyAtPick, settle: resolve }
          setTimeout(resolve, 1000)
        })
        settleRef.current = null
      }
    }

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
      fileName: file.name,
      replaces,
      sentence: isOverPixelBudget
        ? IMAGE_OVER_PIXEL_BUDGET_MESSAGE
        : FAILED_UPLOAD_SENTENCE,
    })
  }

  /** Uploads a picked or dropped file, unless it is refused at selection. */
  const pick = (file: File) => {
    if (controllerRef.current !== null || isCancellingRef.current) return
    const sentence = getRejectedIssueFileSentence(kind, file)
    if (sentence !== null) {
      setFailure(null)
      setRejection(sentence)
      return
    }
    void send(file, hasFile)
  }

  /** Sends the failed file once more. */
  const retry = () => {
    const file = fileRef.current
    if (
      file === null ||
      controllerRef.current !== null ||
      isCancellingRef.current
    ) {
      return
    }
    void send(file, failure?.replaces ?? hasFile)
  }

  /**
   * Stops the upload at any point until it saves; the stored file, or none,
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
    setCancelledFrom({ storedKey })
  }

  /**
   * Stops the upload for an issue that is gone (log 0036): there is
   * nothing to remove and nothing to load again.
   */
  const abandon = () => {
    const controller = controllerRef.current
    if (controller === null) return

    controller.abort()
    endUpload()
    fileRef.current = null
  }

  // A new file whose answer never came may have landed after all: once the
  // issue loads with it, the stored file stands instead of the failure.
  useEffect(() => {
    if (storedKey === null) return
    setFailure((current) => (current?.replaces === false ? null : current))
  }, [storedKey])

  useEffect(() => {
    const pending = settleRef.current
    if (pending !== null && storedKey !== pending.keyAtPick) pending.settle()
  }, [storedKey])

  // The issue has loaded again: say what stayed.
  useEffect(() => {
    if (cancelledFrom === null) return
    setAnnouncement(
      storedKey === cancelledFrom.storedKey
        ? CANCELLED_ANNOUNCEMENT
        : CANCEL_CROSSED_ANNOUNCEMENT[kind],
    )
    setCancelledFrom(null)
  }, [cancelledFrom, storedKey, kind])

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
  // like any other, a new file with its removal.
  const handleUnmount = useEffectEvent(() => {
    const current = uploadRef.current
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl)
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
    isCancelling,
    isUploading: upload !== null,
    pick,
    rejection,
    retry,
    upload,
  }
}
