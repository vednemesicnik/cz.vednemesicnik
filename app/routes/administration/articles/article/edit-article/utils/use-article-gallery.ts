import { createId } from '@paralleldrive/cuid2'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { moveListItem } from '~/utils/move-list-item'

import { getRejectedFileSentence } from './get-rejected-file-sentence'

/** One tile of the editor's gallery, as only the open editor knows it. */
export type GalleryTile = {
  /** `processing` and `failed` live only in the open editor (8kfn4ou3). */
  status: 'stored' | 'processing' | 'failed'
  fileName: string | null
  /** The stored preview, or the browser's while the file processes. */
  previewUrl: string | null
  /** A stored image whose new file is processing; the old one stays. */
  isReplacing: boolean
  /** The new file of a replacement did not process; the old one stays. */
  hasReplaceFailed: boolean
}

type StoredImage = {
  id: string
  fileName: string | null
  previewUrl: string | null
}

type ChangeAnswer =
  | {
      status: 'saved'
      updatedAt: string
      previewUrl?: string | null
      fileName?: string
    }
  | { status: 'not-held'; heldByName: string | null }
  | { status: 'failed' }

type ChangeResult =
  | Extract<ChangeAnswer, { status: 'saved' }>
  | { status: 'failed' | 'unsaved' }

/** The gallery's list in the form, which carries the alt texts and captions. */
type GalleryList = {
  /** The images in their order. */
  getIds: () => string[]
  getTexts: (id: string) => { altText: string; description: string }
  add: (id: string) => void
  remove: (id: string) => void
  move: (from: number, to: number) => void
}

type Options = {
  action: string
  images: StoredImage[]
  featuredImageId: string | null
  /** The tab holding the edit hold; `null` until the page runs. */
  tabId: string | null
  list: GalleryList
  /**
   * Settles a change refused for the hold, as the autosave does (24h, 24i).
   * Resolves `true` once the tab holds it again and the change may go again.
   */
  onNotHeld: (heldByName: string | null) => Promise<boolean>
  /** A change saved; its `updatedAt` is the article's. */
  onSaved: (updatedAt: string) => void
  /** An upload landed: its alt text and caption go with the next save. */
  onUploaded: () => void
}

const toTile = (image: StoredImage): GalleryTile => ({
  fileName: image.fileName,
  hasReplaceFailed: false,
  isReplacing: false,
  previewUrl: image.previewUrl,
  status: 'stored',
})

/**
 * The article editor's gallery, every change saved on its own (design 24b,
 * decision 0027). A picked image uploads at once, each by itself; a file over
 * the limit or not an image gets a sentence instead of a tile. Removal, the
 * main image and the order go one after another, in the order clicked, and a
 * refused one is put back. While an upload is under way the browser asks
 * before the page goes; *Zavřít* in the app does not wait.
 *
 * @param options - The endpoint, the stored images and main image, the tab,
 *   the form's list, and what to do with an answer.
 * @returns The tiles by id, the main image, the rejected files' sentences,
 *   whether a change failed, and the operations.
 */
export const useArticleGallery = ({
  action,
  images,
  featuredImageId: initialFeaturedImageId,
  tabId,
  list,
  onNotHeld,
  onSaved,
  onUploaded,
}: Options) => {
  const authenticityToken = useAuthenticityToken()
  const [tiles, setTiles] = useState(
    () => new Map(images.map((image) => [image.id, toTile(image)])),
  )
  const tilesRef = useRef(tiles)
  tilesRef.current = tiles
  const [featuredImageId, setFeaturedImageId] = useState(initialFeaturedImageId)
  const [rejectedSentences, setRejectedSentences] = useState<string[]>([])
  // A removal, the main image or the order did not save, and was put back.
  const [hasFailedChange, setHasFailedChange] = useState(false)
  const uploadsInFlightRef = useRef(0)
  const queueRef = useRef<Promise<unknown>>(Promise.resolve())
  const objectUrlsRef = useRef(new Map<string, string>())
  const optionsRef = useRef({ list, onNotHeld, onSaved, onUploaded, tabId })
  optionsRef.current = { list, onNotHeld, onSaved, onUploaded, tabId }

  const updateTile = (id: string, change: Partial<GalleryTile>) =>
    setTiles((current) => {
      const tile = current.get(id)
      if (tile === undefined) return current
      return new Map(current).set(id, { ...tile, ...change })
    })

  const dropTile = (id: string) =>
    setTiles((current) => {
      const next = new Map(current)
      next.delete(id)
      return next
    })

  const revokeObjectUrl = (id: string) => {
    const url = objectUrlsRef.current.get(id)
    if (url === undefined) return
    URL.revokeObjectURL(url)
    objectUrlsRef.current.delete(id)
  }

  // One change; a refusal for the hold goes once more after the editor
  // settles it, like the whole-form save.
  const post = async (
    fields: Record<string, string | string[] | Blob>,
    isRetry = false,
  ): Promise<ChangeResult> => {
    const { tabId: currentTabId } = optionsRef.current
    if (currentTabId === null) return { status: 'unsaved' }

    const body = new FormData()
    body.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
    body.append('editTabId', currentTabId)
    for (const [name, value] of Object.entries(fields)) {
      for (const item of Array.isArray(value) ? value : [value]) {
        body.append(name, item)
      }
    }

    let response: Response
    try {
      response = await fetch(action, { body, method: 'POST' })
    } catch {
      return { status: 'unsaved' }
    }

    // An expired session redirects to the sign-in page.
    if (response.redirected) return { status: 'unsaved' }

    let answer: ChangeAnswer
    try {
      answer = (await response.json()) as ChangeAnswer
    } catch {
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

    // 422: the file did not process; anything else is no answer.
    return response.status === 422
      ? { status: 'failed' }
      : { status: 'unsaved' }
  }

  // Removal, the main image and the order reach the server in the order
  // clicked.
  const enqueue = <Result>(change: () => Promise<Result>) => {
    const next = queueRef.current.then(change, change)
    queueRef.current = next
    return next
  }

  const isStored = (id: string) => tilesRef.current.get(id)?.status === 'stored'

  // Uploads go side by side; each tile waits only for its own file.
  const upload = async (id: string, file: File) => {
    uploadsInFlightRef.current += 1
    try {
      const result = await post({
        ...optionsRef.current.list.getTexts(id),
        file,
        imageId: id,
        intent: 'upload',
      })

      if (result.status === 'saved') {
        // The server puts a new image last; one that landed before an image
        // picked earlier sends the order the tiles show.
        if (!isStored(id)) {
          const storedIds = optionsRef.current.list
            .getIds()
            .filter((imageId) => imageId === id || isStored(imageId))
          if (storedIds.at(-1) !== id) {
            void enqueue(() => post({ imageIds: storedIds, intent: 'reorder' }))
          }
        }
        revokeObjectUrl(id)
        updateTile(id, {
          fileName: result.fileName ?? file.name,
          hasReplaceFailed: false,
          isReplacing: false,
          previewUrl: result.previewUrl ?? null,
          status: 'stored',
        })
        optionsRef.current.onUploaded()
        return
      }

      setTiles((current) => {
        const tile = current.get(id)
        if (tile === undefined) return current
        // A replacement keeps the stored image as it is (8kfn4ou3 reply).
        return new Map(current).set(
          id,
          tile.isReplacing
            ? { ...tile, hasReplaceFailed: true, isReplacing: false }
            : { ...tile, status: 'failed' },
        )
      })
    } finally {
      uploadsInFlightRef.current -= 1
    }
  }

  const rememberPreview = (id: string, file: File) => {
    revokeObjectUrl(id)
    const url = URL.createObjectURL(file)
    objectUrlsRef.current.set(id, url)
    return url
  }

  /** New images, each uploading at once; refused files get a sentence. */
  const addFiles = (files: File[]) => {
    const sentences: string[] = []

    for (const file of files) {
      const sentence = getRejectedFileSentence(file)
      if (sentence !== null) {
        sentences.push(sentence)
        continue
      }

      const id = createId()
      setTiles((current) =>
        new Map(current).set(id, {
          fileName: file.name,
          hasReplaceFailed: false,
          isReplacing: false,
          previewUrl: rememberPreview(id, file),
          status: 'processing',
        }),
      )
      optionsRef.current.list.add(id)
      void upload(id, file)
    }

    // The next pick clears what the last one refused (24b).
    setRejectedSentences(sentences)
  }

  /**
   * Another file for a tile: a stored image's replacement, or a failed new
   * image's second try under the same id.
   */
  const replaceFile = (id: string, file: File) => {
    const sentence = getRejectedFileSentence(file)
    setRejectedSentences(sentence === null ? [] : [sentence])
    const tile = tilesRef.current.get(id)
    if (sentence !== null || tile === undefined) return

    if (tile.status === 'stored') {
      updateTile(id, { hasReplaceFailed: false, isReplacing: true })
    } else {
      updateTile(id, {
        fileName: file.name,
        previewUrl: rememberPreview(id, file),
        status: 'processing',
      })
    }
    void upload(id, file)
  }

  /** Removes a stored image (after its dialog) or drops a failed one. */
  const remove = async (id: string) => {
    if (!isStored(id)) {
      revokeObjectUrl(id)
      optionsRef.current.list.remove(id)
      dropTile(id)
      return
    }

    const result = await enqueue(() => post({ imageId: id, intent: 'remove' }))
    setHasFailedChange(result.status !== 'saved')
    if (result.status !== 'saved') return

    optionsRef.current.list.remove(id)
    dropTile(id)
    setFeaturedImageId((current) => (current === id ? null : current))
  }

  /** Sets the main image, or none with `null`. */
  const setFeatured = async (id: string | null) => {
    const previous = featuredImageId
    setFeaturedImageId(id)

    const result = await enqueue(() =>
      post({ intent: 'feature', ...(id === null ? {} : { imageId: id }) }),
    )
    setHasFailedChange(result.status !== 'saved')
    if (result.status !== 'saved') setFeaturedImageId(previous)
  }

  /**
   * Moves a stored image to another place among the stored ones; an image
   * still processing or failed keeps its tile where it is.
   *
   * @param id - The stored image.
   * @param to - Its new place among the stored images.
   */
  const move = async (id: string, to: number) => {
    const ids = optionsRef.current.list.getIds()
    const storedIds = ids.filter(isStored)
    const from = storedIds.indexOf(id)
    if (from === -1 || to === from || to < 0 || to >= storedIds.length) return

    // In the form the tile takes the place of the stored image it passes.
    const listFrom = ids.indexOf(id)
    const listTo = ids.indexOf(storedIds[to])
    optionsRef.current.list.move(listFrom, listTo)

    const result = await enqueue(() =>
      post({
        imageIds: moveListItem(storedIds, from, to),
        intent: 'reorder',
      }),
    )
    setHasFailedChange(result.status !== 'saved')
    if (result.status !== 'saved') {
      optionsRef.current.list.move(listTo, listFrom)
    }
  }

  // An upload on its way is lost with the page; the browser asks (24b).
  const handleBeforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (uploadsInFlightRef.current === 0) return
    event.preventDefault()
    event.returnValue = ''
  })
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) =>
      handleBeforeUnload(event)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    const objectUrls = objectUrlsRef.current
    return () => {
      for (const url of objectUrls.values()) URL.revokeObjectURL(url)
    }
  }, [])

  const processingCount = [...tiles.values()].filter(
    (tile) => tile.status === 'processing' || tile.isReplacing,
  ).length

  return {
    addFiles,
    featuredImageId,
    hasFailedChange,
    move,
    processingCount,
    rejectedSentences,
    remove,
    replaceFile,
    setFeatured,
    tiles,
  }
}
