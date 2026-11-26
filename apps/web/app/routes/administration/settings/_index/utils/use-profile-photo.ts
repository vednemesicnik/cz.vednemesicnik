import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { href, useRevalidator } from 'react-router'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { useWaitForChange } from '~/hooks/use-wait-for-change'
import {
  FAILED_MESSAGE,
  IMAGE_TOO_LARGE_MESSAGE,
  MAX_PROFILE_IMAGE_SIZE,
  NOT_AN_IMAGE_MESSAGE,
} from '~/routes/administration/settings/photo/_schema'

// Said once the profile has loaded again after a cancel (axz8tav5).
const CANCELLED_ANNOUNCEMENT = 'Nahrávání zrušeno.'
const CROSSED_ANNOUNCEMENT =
  'Obrázek už je uložený. Nahrávání se nepodařilo zrušit.'

type Answer =
  | { status: 'saved' | 'removed' | 'cancelled' | 'unsaved' }
  | { status: 'invalid' | 'failed'; imageError: string }

type Upload = {
  /** The picked file, shown in the avatar while it uploads (29b). */
  previewUrl: string
  /** Whether a photo was there when it was picked. */
  replaces: boolean
  /** The photo it replaces, to tell after a cancel what stayed. */
  previousSource: string | undefined
}

type Options = {
  hasImage: boolean
  /** The stored photo's URL, which changes with every version. */
  imageSource: string | undefined
}

/**
 * The profile photo's upload (design 29b, log 0029): it goes on `fetch`
 * as soon as it is picked and can be cancelled until it saves. A cancelled
 * first photo is always sent a removal too, because the abort loses an answer
 * already on its way; a replacement whose answer crossed the cancel stays.
 * After the cancel the profile loads again and the screen reader hears what
 * stayed. The browser asks before the tab closes during an upload.
 *
 * @param options - Whether there is a photo now, and its URL.
 * @returns The upload under way, how the last one ended, the error to show,
 *   the announcement, and `pick`, `cancel` and `remove`.
 */
export const useProfilePhoto = ({ hasImage, imageSource }: Options) => {
  const authenticityToken = useAuthenticityToken()
  const revalidator = useRevalidator()
  const waitForStoredPhoto = useWaitForChange(imageSource)
  const imageSourceRef = useRef(imageSource)
  imageSourceRef.current = imageSource
  const controllerRef = useRef<AbortController | null>(null)
  const uploadRef = useRef<Upload | null>(null)
  const [upload, setUpload] = useState<Upload | null>(null)
  const [lastOutcome, setLastOutcome] = useState<'saved' | 'failed' | null>(
    null,
  )
  const [imageError, setImageError] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  // Until a cancel has sent its removal and the profile loaded again, so a
  // new pick cannot race it.
  const [isCancelling, setIsCancelling] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  const showUpload = (next: Upload | null) => {
    uploadRef.current = next
    setUpload(next)
  }

  const post = async (
    fields: Record<string, string | Blob>,
    signal?: AbortSignal,
  ): Promise<Answer> => {
    const body = new FormData()
    body.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    for (const [name, value] of Object.entries(fields)) {
      body.append(name, value)
    }

    let response: Response
    try {
      response = await fetch(href('/administration/settings/photo'), {
        body,
        method: 'POST',
        signal,
      })
    } catch {
      return { status: signal?.aborted ? 'cancelled' : 'unsaved' }
    }

    // An expired session redirects to the sign-in page.
    if (response.redirected) return { status: 'unsaved' }

    try {
      return (await response.json()) as Answer
    } catch {
      return { status: signal?.aborted ? 'cancelled' : 'unsaved' }
    }
  }

  const pick = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError(NOT_AN_IMAGE_MESSAGE)
      return
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setImageError(IMAGE_TOO_LARGE_MESSAGE)
      return
    }

    const controller = new AbortController()
    controllerRef.current = controller
    const previewUrl = URL.createObjectURL(file)
    const sourceAtPick = imageSource
    setImageError(null)
    setLastOutcome(null)
    setAnnouncement('')
    showUpload({
      previewUrl,
      previousSource: sourceAtPick,
      replaces: hasImage,
    })

    const answer = await post(
      { image: file, intent: 'upload' },
      controller.signal,
    )

    // The upload lasts until the new photo has rendered: the revalidation
    // resolves before React shows its data, and ending earlier would show the
    // previous photo for a moment.
    if (answer.status === 'saved' && !controller.signal.aborted) {
      await revalidator.revalidate()
      await waitForStoredPhoto(sourceAtPick)
    }

    // A cancel settled it already, and its answer is lost.
    if (controller.signal.aborted) return

    controllerRef.current = null
    URL.revokeObjectURL(previewUrl)
    showUpload(null)

    if (answer.status === 'saved') {
      setLastOutcome('saved')
    } else {
      setLastOutcome('failed')
      setImageError('imageError' in answer ? answer.imageError : FAILED_MESSAGE)
    }
  }

  /**
   * Stops the upload at any point until it saves; the previous photo, or
   * none, stays.
   */
  const cancel = async () => {
    const controller = controllerRef.current
    const current = uploadRef.current
    if (controller === null || current === null) return

    controller.abort()
    controllerRef.current = null
    URL.revokeObjectURL(current.previewUrl)
    showUpload(null)
    setIsCancelling(true)

    if (!current.replaces) await post({ intent: 'remove' })
    await revalidator.revalidate()
    setIsCancelling(false)
    void announceCancel(current)
  }

  // The profile has loaded again: say what stayed. A cancelled first photo is
  // always removed; a replacement whose answer crossed the cancel shows once
  // its photo has rendered, which a revalidation does not wait for (as the
  // cover, #852).
  const announceCancel = async (current: Upload) => {
    if (!current.replaces) {
      setAnnouncement(CANCELLED_ANNOUNCEMENT)
      return
    }
    await waitForStoredPhoto(current.previousSource)
    setAnnouncement(
      imageSourceRef.current === current.previousSource
        ? CANCELLED_ANNOUNCEMENT
        : CROSSED_ANNOUNCEMENT,
    )
  }

  const remove = async () => {
    setImageError(null)
    setIsRemoving(true)
    await post({ intent: 'remove' })
    await revalidator.revalidate()
    setIsRemoving(false)
  }

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

  // Gone with an upload under way (no confirm let it go): it is cancelled
  // like any other, a first photo with its removal.
  const handleUnmount = useEffectEvent(() => {
    const current = uploadRef.current
    if (current === null) return
    URL.revokeObjectURL(current.previewUrl)
    if (controllerRef.current === null) return
    controllerRef.current.abort()
    controllerRef.current = null
    if (!current.replaces) void post({ intent: 'remove' })
  })
  useEffect(() => () => handleUnmount(), [])

  return {
    announcement,
    cancel,
    imageError,
    isCancelling,
    isRemoving,
    isUploading: upload !== null,
    lastOutcome,
    pick,
    remove,
    upload,
  }
}
