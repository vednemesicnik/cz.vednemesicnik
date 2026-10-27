import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { href, useRevalidator } from 'react-router'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { IMAGE_OVER_PIXEL_BUDGET_MESSAGE } from '~/config/image-variants-config'
import { useWaitForChange } from '~/hooks/use-wait-for-change'

import { getRejectedEpisodeCoverSentence } from './get-rejected-episode-cover-sentence'

// Said under the field once an upload failed (copy yzyd9p1l).
const FAILED_UPLOAD_SENTENCE =
  'Zkuste soubor nahrát znovu — nahrání se nepovedlo.'

type Answer =
  | { status: 'saved'; updatedAt: string }
  | { status: 'failed'; reason?: 'over-pixel-budget' }
  | { status: 'unsaved' }

/** The last upload that failed, until another pick or a retry. */
export type EpisodeCoverFailure = {
  sentence: string
  /** The same file again: not for one over the pixel budget. */
  canRetry: boolean
}

type Options = {
  podcastId: string
  episodeId: string
  /** The editor's tab, `null` until it holds the edit. */
  tabId: string | null
  /** The own cover as loaded, which changes with every upload. */
  storedKey: string | null
  /** Refused for the hold: `true` when the editor took it back and may retry. */
  onNotHeld: (heldByName: string | null) => Promise<boolean>
  /** The episode is gone (0036): the editor rechecks its hold. */
  onDeleted: () => Promise<void>
  /** The episode's new `updatedAt` after a saved change. */
  onSaved: (updatedAt: string) => void
}

/**
 * The episode's own cover (design 27d): a picked image goes on `fetch` at
 * once, alone, as the issue's cover does (26c, log 0029), and *Použít obálku
 * podcastu* removes it. A failed upload keeps its file for *Zkusit znovu*.
 * The browser asks before the tab closes during an upload. Cancelling an
 * upload is #712.
 *
 * @param options - The episode, the tab, the stored cover, and what the
 *   editor does with a refusal for the hold, a deleted episode and a save.
 * @returns The picked cover's preview while it uploads, whether a change is
 *   under way, the last failure, the sentence of a refused pick, and `pick`,
 *   `retry` and `remove`.
 */
export const useEpisodeCoverUpload = ({
  podcastId,
  episodeId,
  tabId,
  storedKey,
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
  const waitForStoredCover = useWaitForChange(storedKey)
  const action = href(
    '/administration/podcasts/:podcastId/episodes/:episodeId/cover',
    { episodeId, podcastId },
  )

  // One change at a time.
  const isBusyRef = useRef(false)
  const [isBusy, setIsBusy] = useState(false)
  const fileRef = useRef<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [failure, setFailure] = useState<EpisodeCoverFailure | null>(null)
  const [rejection, setRejection] = useState<string | null>(null)

  const setBusy = (next: boolean) => {
    isBusyRef.current = next
    setIsBusy(next)
  }

  // One change; a refusal for the hold goes once more after the editor takes
  // it back, like the whole-form save.
  const post = async (
    fields: Record<string, string | Blob>,
    isRetry = false,
  ): Promise<Answer> => {
    const { tabId: currentTabId } = optionsRef.current
    if (currentTabId === null) return { status: 'unsaved' }

    const body = new FormData()
    body.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    body.append('editTabId', currentTabId)
    for (const [name, value] of Object.entries(fields)) body.append(name, value)

    let response: Response
    try {
      response = await fetch(action, { body, method: 'POST' })
    } catch {
      return { status: 'unsaved' }
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
      return { status: 'unsaved' }
    }

    // Deleted meanwhile (0036): the hold learns it and the editor only reads.
    if (answer.status === 'deleted') {
      await optionsRef.current.onDeleted()
      return { status: 'unsaved' }
    }

    if (answer.status === 'not-held') {
      const mayRetry = await optionsRef.current.onNotHeld(answer.heldByName)
      return mayRetry && !isRetry ? post(fields, true) : { status: 'unsaved' }
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
    setBusy(true)
    fileRef.current = file
    setFailure(null)
    setRejection(null)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    const keyAtPick = storedKeyRef.current
    const answer = await post({ file, intent: 'upload' })
    await settle(answer, keyAtPick)

    URL.revokeObjectURL(url)
    setPreviewUrl(null)
    setBusy(false)

    if (answer.status === 'saved') {
      fileRef.current = null
      return
    }

    const isOverPixelBudget =
      answer.status === 'failed' && answer.reason === 'over-pixel-budget'
    setFailure({
      canRetry: !isOverPixelBudget,
      sentence: isOverPixelBudget
        ? IMAGE_OVER_PIXEL_BUDGET_MESSAGE
        : FAILED_UPLOAD_SENTENCE,
    })
  }

  /** Uploads a picked file, unless it is refused at selection. */
  const pick = (file: File) => {
    if (isBusyRef.current) return
    const sentence = getRejectedEpisodeCoverSentence(file)
    if (sentence !== null) {
      setFailure(null)
      setRejection(sentence)
      return
    }
    void send(file)
  }

  /** Sends the failed file once more. */
  const retry = () => {
    const file = fileRef.current
    if (file === null || isBusyRef.current) return
    void send(file)
  }

  /** *Použít obálku podcastu*: the own cover goes. */
  const remove = async () => {
    if (isBusyRef.current) return
    setBusy(true)
    fileRef.current = null
    setFailure(null)
    setRejection(null)

    const keyAtStart = storedKeyRef.current
    await settle(await post({ intent: 'remove' }), keyAtStart)
    setBusy(false)
  }

  // An upload on its way is lost with the page; the browser asks.
  const handleBeforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (previewUrl === null) return
    event.preventDefault()
    event.returnValue = ''
  })
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) =>
      handleBeforeUnload(event)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  return {
    failure,
    isBusy,
    isUploading: previewUrl !== null,
    pick,
    previewUrl,
    rejection,
    remove,
    retry,
  }
}
