import { createId } from '@paralleldrive/cuid2'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { FORM_CONFIG } from '~/config/form-config'

import { getRejectedFileSentence } from './get-rejected-file-sentence'
import { getStoredMoveIndexes } from './get-stored-move-indexes'
import { isTileUploading } from './is-tile-uploading'

type TileFile = {
  fileName: string | null
  previewUrl: string | null
}

/** One tile of the editor's gallery, as only the open editor knows it. */
export type GalleryTile = TileFile & {
  /** `uploading` and `failed` live only in the open editor (8kfn4ou3). */
  status: 'stored' | 'uploading' | 'failed'
  /**
   * A stored image whose new file uploads: the tile shows the new file, and
   * a cancel or a failure returns to this one, which stays stored (24b).
   */
  replaced: TileFile | null
  /** The new file of a replacement did not process; the old one stays. */
  hasReplaceFailed: boolean
  /** The failed file is over the pixel budget: the tile says so (4al3quzt). */
  isOverPixelBudget: boolean
  /**
   * A failed new image whose upload got no answer: it may have landed, so
   * removing it asks the server too.
   */
  isUnconfirmed: boolean
  /** Its removal is on its way: no more changes to it. */
  isRemoving: boolean
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
      /** The upload was the empty gallery's first image (log 0053). */
      becameFeatured?: boolean
    }
  | { status: 'not-held'; heldByName: string | null }
  | ChangeFailure

/** The file did not process; an image over the pixel budget says so. */
type ChangeFailure = { status: 'failed'; reason?: 'over-pixel-budget' }

type ChangeResult =
  | Extract<ChangeAnswer, { status: 'saved' }>
  | ChangeFailure
  | { status: 'unsaved' | 'cancelled' }

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
  isOverPixelBudget: false,
  isRemoving: false,
  isUnconfirmed: false,
  previewUrl: image.previewUrl,
  replaced: null,
  status: 'stored',
})

/**
 * The article editor's gallery, every change saved on its own (design 24b,
 * log 0027). A picked image uploads at once, each by itself; a file over
 * the limit or not an image gets a sentence instead of a tile. An upload can
 * be cancelled until it saves (bxy8xxqs). Removal, the main image and the
 * order go one after another, in the order clicked, and a refused one is put
 * back. While an upload is under way the browser asks before the page goes.
 *
 * @param options - The endpoint, the stored images and main image, the tab,
 *   the form's list, and what to do with an answer.
 * @returns The tiles by id, the main image, the rejected files' sentences,
 *   whether a change failed, the upload counts, and the operations.
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
  // The images the server has, kept in step at once, ahead of a render.
  const storedIdsRef = useRef(new Set(images.map(({ id }) => id)))
  // A new image landed before one picked earlier: the server's order is not
  // the tiles' until the uploads settle.
  const isOrderStaleRef = useRef(false)
  const [featuredImageId, setFeaturedImageId] = useState(initialFeaturedImageId)
  // The main image as the last change left it, ahead of a render.
  const featuredImageIdRef = useRef(featuredImageId)
  featuredImageIdRef.current = featuredImageId
  const [rejectedSentences, setRejectedSentences] = useState<string[]>([])
  // A removal, the main image or the order did not save, and was put back.
  const [hasFailedChange, setHasFailedChange] = useState(false)
  const uploadsInFlightRef = useRef(0)
  // Each upload under way, by tile, to cancel it (bxy8xxqs).
  const uploadControllersRef = useRef(new Map<string, AbortController>())
  // Uploads that failed in this opening, for the close dialog (moo05ljj).
  const [uploadFailureCount, setUploadFailureCount] = useState(0)
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
  // settles it, like the whole-form save. An upload carries a signal that
  // cancels it.
  const post = async (
    fields: Record<string, string | string[] | Blob>,
    signal?: AbortSignal,
    isRetry = false,
  ): Promise<ChangeResult> => {
    const { tabId: currentTabId } = optionsRef.current
    if (currentTabId === null) return { status: 'unsaved' }
    if (signal?.aborted) return { status: 'cancelled' }

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
      response = await fetch(action, { body, method: 'POST', signal })
    } catch {
      return { status: signal?.aborted ? 'cancelled' : 'unsaved' }
    }

    // An expired session redirects to the sign-in page.
    if (response.redirected) return { status: 'unsaved' }

    let answer: ChangeAnswer
    try {
      answer = (await response.json()) as ChangeAnswer
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
    return response.status === 422
      ? { reason: answer.reason, status: 'failed' }
      : { status: 'unsaved' }
  }

  // Removal, the main image and the order reach the server in the order
  // clicked.
  const enqueue = <Result>(change: () => Promise<Result>) => {
    const next = queueRef.current.then(change, change)
    queueRef.current = next
    return next
  }

  const isStored = (id: string) => storedIdsRef.current.has(id)

  // The stored images in the order the tiles show, read when it is sent.
  const getStoredOrder = () => optionsRef.current.list.getIds().filter(isStored)

  // Moves a stored image to a place among the stored ones in the form's list
  // as it stands now, so a put-back finds the tile wherever later changes
  // left it. Returns the place it had, or -1 when it did not move.
  const moveToStoredPlace = (id: string, to: number) => {
    const ids = optionsRef.current.list.getIds()
    const storedIds = ids.filter(isStored)
    const indexes = getStoredMoveIndexes(ids, storedIds, id, to)
    if (indexes === null) return -1
    optionsRef.current.list.move(indexes.from, indexes.to)
    return storedIds.indexOf(id)
  }

  // Once no upload is under way, the server gets the tiles' order if a new
  // image landed out of turn.
  const syncOrderAfterUploads = async () => {
    if (uploadsInFlightRef.current > 0 || !isOrderStaleRef.current) return
    isOrderStaleRef.current = false
    const result = await enqueue(() =>
      post({ imageIds: getStoredOrder(), intent: 'reorder' }),
    )
    if (result.status !== 'saved') setHasFailedChange(true)
  }

  // Uploads go side by side; each tile waits only for its own file.
  const upload = async (id: string, file: File) => {
    const controller = new AbortController()
    uploadControllersRef.current.set(id, controller)
    uploadsInFlightRef.current += 1
    try {
      const result = await post(
        {
          ...optionsRef.current.list.getTexts(id),
          file,
          imageId: id,
          intent: 'upload',
        },
        controller.signal,
      )

      // The cancel settled the tile already, and its answer is lost.
      if (controller.signal.aborted || result.status === 'cancelled') return

      if (result.status === 'saved') {
        // The server puts a new image last, and a new main image first.
        if (!isStored(id)) {
          storedIdsRef.current.add(id)
          if (!result.becameFeatured && getStoredOrder().at(-1) !== id) {
            isOrderStaleRef.current = true
          }
        }
        // The main image stands first (0028), before the tiles still
        // uploading, so the others land after it.
        if (result.becameFeatured) {
          featuredImageIdRef.current = id
          setFeaturedImageId(id)
          const { list } = optionsRef.current
          const from = list.getIds().indexOf(id)
          if (from > 0) list.move(from, 0)
        }
        revokeObjectUrl(id)
        updateTile(id, {
          fileName: result.fileName ?? file.name,
          hasReplaceFailed: false,
          isOverPixelBudget: false,
          isUnconfirmed: false,
          previewUrl: result.previewUrl ?? null,
          replaced: null,
          status: 'stored',
        })
        optionsRef.current.onUploaded()
        return
      }

      setUploadFailureCount((count) => count + 1)
      if (tilesRef.current.get(id)?.replaced) revokeObjectUrl(id)
      const isOverPixelBudget =
        result.status === 'failed' && result.reason === 'over-pixel-budget'
      setTiles((current) => {
        const tile = current.get(id)
        if (tile === undefined) return current
        // A replacement keeps the stored image as it is (8kfn4ou3 reply).
        return new Map(current).set(
          id,
          tile.replaced
            ? {
                ...tile,
                ...tile.replaced,
                hasReplaceFailed: true,
                isOverPixelBudget,
                replaced: null,
              }
            : {
                ...tile,
                isOverPixelBudget,
                isUnconfirmed: result.status !== 'failed',
                status: 'failed',
              },
        )
      })
    } finally {
      if (uploadControllersRef.current.get(id) === controller) {
        uploadControllersRef.current.delete(id)
      }
      uploadsInFlightRef.current -= 1
      void syncOrderAfterUploads()
    }
  }

  const rememberPreview = (id: string, file: File) => {
    revokeObjectUrl(id)
    const url = URL.createObjectURL(file)
    objectUrlsRef.current.set(id, url)
    return url
  }

  /**
   * New images, each uploading at once; refused files get a sentence.
   *
   * @returns The ids of the tiles it made, in the order picked.
   */
  const addFiles = (files: File[]): string[] => {
    const sentences: string[] = []
    const addedIds: string[] = []

    for (const file of files) {
      const sentence = getRejectedFileSentence(file)
      if (sentence !== null) {
        sentences.push(sentence)
        continue
      }

      const id = createId()
      // Made outside the updater, which React may run twice.
      const previewUrl = rememberPreview(id, file)
      setTiles((current) =>
        new Map(current).set(id, {
          fileName: file.name,
          hasReplaceFailed: false,
          isOverPixelBudget: false,
          isRemoving: false,
          isUnconfirmed: false,
          previewUrl,
          replaced: null,
          status: 'uploading',
        }),
      )
      optionsRef.current.list.add(id)
      addedIds.push(id)
      void upload(id, file)
    }

    // The next pick clears what the last one refused (24b).
    setRejectedSentences(sentences)
    return addedIds
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

    // The tile shows the new file while it uploads (bxy8xxqs).
    const picked = {
      fileName: file.name,
      previewUrl: rememberPreview(id, file),
    }
    if (tile.status === 'stored') {
      updateTile(id, {
        ...picked,
        hasReplaceFailed: false,
        isOverPixelBudget: false,
        replaced: { fileName: tile.fileName, previewUrl: tile.previewUrl },
      })
    } else {
      updateTile(id, {
        ...picked,
        isOverPixelBudget: false,
        status: 'uploading',
      })
    }
    void upload(id, file)
  }

  // The server checks for the cancel up to its commit, but an answer already
  // on its way is lost with the abort, so a new image is removed as well: one
  // that never landed counts as removed (0027). A replacement whose answer
  // crossed the cancel stays replaced.
  const cancel = (id: string, { keepsList }: { keepsList: boolean }) => {
    const controller = uploadControllersRef.current.get(id)
    const tile = tilesRef.current.get(id)
    if (controller === undefined || tile === undefined) return false

    controller.abort()
    uploadControllersRef.current.delete(id)
    revokeObjectUrl(id)
    if (tile.replaced) {
      updateTile(id, { ...tile.replaced, replaced: null })
    } else {
      void enqueue(() => post({ imageId: id, intent: 'remove' }))
      if (!keepsList) optionsRef.current.list.remove(id)
      dropTile(id)
    }
    return true
  }

  /**
   * Cancels a tile's upload, at any point until it saves (24b, bxy8xxqs). A
   * new image's tile goes, with what was typed in it; a replacement returns
   * to the stored image. The server keeps nothing.
   *
   * @returns Whether an upload was cancelled.
   */
  const cancelUpload = (id: string): boolean => cancel(id, { keepsList: false })

  /**
   * Cancels every upload under way: the editor is about to close, so the
   * form's list stays as it is.
   *
   * @returns Settles once the server has heard of the cancels.
   */
  const cancelUploads = async () => {
    for (const id of [...uploadControllersRef.current.keys()]) {
      cancel(id, { keepsList: true })
    }
    await queueRef.current.catch(() => {})
  }

  /**
   * Removes a stored image (after its dialog) or drops a failed one; one whose
   * upload got no answer is removed on the server too, in case it landed.
   *
   * @returns Whether the tile is gone.
   */
  const remove = async (id: string): Promise<boolean> => {
    const tile = tilesRef.current.get(id)
    if (tile === undefined || tile.isRemoving) return false

    const drop = () => {
      revokeObjectUrl(id)
      storedIdsRef.current.delete(id)
      optionsRef.current.list.remove(id)
      dropTile(id)
    }

    if (!isStored(id) && !tile.isUnconfirmed) {
      drop()
      return true
    }

    updateTile(id, { isRemoving: true })
    const result = await enqueue(() => post({ imageId: id, intent: 'remove' }))
    setHasFailedChange(result.status !== 'saved')
    if (result.status !== 'saved') {
      updateTile(id, { isRemoving: false })
      return false
    }

    drop()
    setFeaturedImageId((current) => (current === id ? null : current))
    return true
  }

  /**
   * Sets the main image, or none with `null`. The main image stands first
   * (yj2t50dd): a new one moves to the first place in the same change; none
   * leaves the last one first. A refused change is put back by id, wherever
   * later changes moved the tiles.
   *
   * @returns Whether it saved.
   */
  const setFeatured = async (id: string | null): Promise<boolean> => {
    const previous = featuredImageIdRef.current
    featuredImageIdRef.current = id
    setFeaturedImageId(id)
    const from = id === null ? -1 : moveToStoredPlace(id, 0)

    const result = await enqueue(() =>
      post({ intent: 'feature', ...(id === null ? {} : { imageId: id }) }),
    )
    setHasFailedChange(result.status !== 'saved')
    // Put back unless a later change set another main image meanwhile.
    if (result.status !== 'saved' && featuredImageIdRef.current === id) {
      featuredImageIdRef.current = previous
      setFeaturedImageId(previous)
      if (id !== null && from !== -1) moveToStoredPlace(id, from)
      if (previous !== null) moveToStoredPlace(previous, 0)
    }
    return result.status === 'saved'
  }

  /**
   * Moves a stored image to another place among the stored ones; an image
   * still uploading or failed keeps its tile where it is.
   *
   * @param id - The stored image.
   * @param to - Its new place among the stored images.
   * @returns Whether the new order saved.
   */
  const move = async (id: string, to: number): Promise<boolean> => {
    const from = moveToStoredPlace(id, to)
    if (from === -1) return false

    // The order as it stands when the change goes, after those before it.
    const result = await enqueue(() =>
      post({ imageIds: getStoredOrder(), intent: 'reorder' }),
    )
    setHasFailedChange(result.status !== 'saved')
    if (result.status !== 'saved') moveToStoredPlace(id, from)
    return result.status === 'saved'
  }

  // An upload on its way is lost with the page; the browser asks (24b). A
  // cancelled one stops counting at once, so a leave after the dialog does
  // not ask twice.
  const handleBeforeUnload = useEffectEvent((event: BeforeUnloadEvent) => {
    if (uploadControllersRef.current.size === 0) return
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

  const uploadingTiles = [...tiles.values()].filter(isTileUploading)

  return {
    addFiles,
    cancelUpload,
    cancelUploads,
    featuredImageId,
    hasFailedChange,
    move,
    rejectedSentences,
    remove,
    replaceFile,
    /** Replacements under way: their originals stay with the article. */
    replacingCount: uploadingTiles.filter((tile) => tile.replaced !== null)
      .length,
    setFeatured,
    tiles,
    /** Uploads that failed since the editor opened; only ever grows. */
    uploadFailureCount,
    /** Images uploading, new and replacements alike (24b, 24f). */
    uploadingCount: uploadingTiles.length,
  }
}
