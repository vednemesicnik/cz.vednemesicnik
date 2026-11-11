import { clsx } from 'clsx'
import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from 'react'
import { CloseIcon } from '~/components/icons/close-icon'
import { KeyboardArrowLeftIcon } from '~/components/icons/keyboard-arrow-left-icon'
import { KeyboardArrowRightIcon } from '~/components/icons/keyboard-arrow-right-icon'
import { Image } from '~/components/image'
import { Tooltip } from '~/components/tooltip'
import { DRAG_FADE_DISTANCE } from '~/config/image-viewer-config'
import { useViewerGestures } from '~/hooks/use-viewer-gestures'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

export type GalleryImage = {
  id: string
  alt: string
  description?: ReactNode
  sources: ImageSources
}

type Props = {
  images: Array<GalleryImage>
  index: number
  isOpen: boolean
  onIndexChange: (index: number) => void
  ref: RefObject<HTMLDialogElement | null>
  className?: string
}

// The time the close takes (design 12b): the photo is put back after it.
const CLOSE_DURATION = 150

// What a click may land on without closing the viewer.
const KEEPS_OPEN = 'button, a, figcaption, [data-keeps-open]'

/**
 * The image viewer for the whole gallery (design 12b, zn43av9y): the window
 * on a near-black backdrop, dark on the light site too, with the counter
 * *n z N* and the close button in a band at the top, the arrows at the window
 * edges and the caption at the bottom. It pages round from the last image to
 * the first and back by the arrows, ← → and a swipe; with a single image it
 * has no arrows (m8ei8fno). On touch a drag down closes it, and pinch or a
 * double tap zooms the photo.
 *
 * The parent opens it, through `useViewerHistory` so that Back closes it. It
 * closes by the ×, Esc, Back, a click on the dark area and a drag down.
 *
 * @param index - The image shown; the parent owns it, so a tile can open the
 *   viewer at its own image.
 * @param isOpen - Whether the viewer is open. Only then do the photo and its
 *   neighbours load, so a page with a gallery loads none of them up front.
 * @param onIndexChange - Called with the next index when the reader pages.
 */
export const ImageGalleryDialog = ({
  images,
  index,
  isOpen,
  onIndexChange,
  ref,
  className,
}: Props) => {
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  const count = images.length
  const hasPaging = count > 1
  const currentIndex = index < count ? index : 0
  const image = images[currentIndex]
  const previousIndex = (currentIndex - 1 + count) % count
  const nextIndex = (currentIndex + 1) % count

  const showPrevious = () => onIndexChange(previousIndex)
  const showNext = () => onIndexChange(nextIndex)
  const handleClose = () => ref.current?.close()

  const { dragDistance, handlers, isActive, offset, reset, scale } =
    useViewerGestures({
      canPage: hasPaging,
      frameRef,
      onDismiss: handleClose,
      onNext: showNext,
      onPrevious: showPrevious,
      stageRef,
    })

  // Each image opens whole.
  // biome-ignore lint/correctness/useExhaustiveDependencies: resets on a new image
  useEffect(() => {
    reset()
  }, [currentIndex, reset])

  // Put back after the close has played, so the photo leaves the way it went.
  useEffect(() => {
    const dialog = ref.current

    if (dialog === null) return

    let timeout: ReturnType<typeof setTimeout> | undefined

    const handleDialogClose = () => {
      timeout = setTimeout(reset, CLOSE_DURATION)
    }

    dialog.addEventListener('close', handleDialogClose)

    return () => {
      clearTimeout(timeout)
      dialog.removeEventListener('close', handleDialogClose)
    }
  }, [ref, reset])

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (!hasPaging) return

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      showPrevious()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      showNext()
    }
  }

  // The dialog fills the window, so a click on the dark area lands on it.
  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target instanceof Element && event.target.closest(KEEPS_OPEN)) {
      return
    }

    handleClose()
  }

  const dragProgress = Math.min(1, dragDistance / DRAG_FADE_DISTANCE)
  const isZoomed = scale > 1
  const neighbours =
    isOpen && hasPaging
      ? [...new Set([previousIndex, nextIndex])].filter(
          (neighbourIndex) => neighbourIndex !== currentIndex,
        )
      : []

  return (
    <dialog
      aria-label={'Galerie'}
      className={clsx(styles.dialog, className)}
      data-color-scheme={'dark'}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      ref={ref}
      style={{ '--drag-progress': dragProgress } as CSSProperties}
      tabIndex={-1}
    >
      {image && (
        <>
          <div className={styles.band}>
            <span aria-live={'polite'} className={styles.counter}>
              {currentIndex + 1} z {count}
            </span>
            <Tooltip label={'Zavřít galerii'} placement={'bottom'}>
              <button
                aria-label={'Zavřít galerii'}
                className={styles.iconButton}
                onClick={handleClose}
                type={'button'}
              >
                <CloseIcon />
              </button>
            </Tooltip>
          </div>

          <figure className={styles.figure}>
            <div className={styles.stage} ref={stageRef}>
              {/* Keyed, so the next image mounts whole, with nothing to
                  transition from the last one's zoom. */}
              <div
                {...handlers}
                className={styles.frame}
                data-active={isActive || undefined}
                data-keeps-open={true}
                key={image.id}
                ref={frameRef}
                style={
                  {
                    '--image-ratio': `${image.sources.width ?? 3} / ${image.sources.height ?? 2}`,
                    '--image-width': image.sources.width ?? 1920,
                    transform: `translate(${offset.x}px, ${offset.y + dragDistance}px) scale(${scale * (1 - dragProgress * 0.15)})`,
                  } as CSSProperties
                }
              >
                <Image
                  {...image.sources}
                  alt={image.alt}
                  className={styles.image}
                  loading={isOpen ? 'eager' : 'lazy'}
                  sizes={isZoomed ? '200vw' : '100vw'}
                />
              </div>
            </div>

            {/* On the whole area below the band, not on the stage, whose height
                follows the caption: the arrows never move while paging. */}
            {hasPaging && (
              <>
                <Tooltip
                  className={clsx(styles.arrowAnchor, styles.previous)}
                  label={'Předchozí obrázek'}
                >
                  <button
                    aria-label={'Předchozí obrázek'}
                    className={styles.iconButton}
                    onClick={showPrevious}
                    type={'button'}
                  >
                    <KeyboardArrowLeftIcon />
                  </button>
                </Tooltip>
                <Tooltip
                  className={clsx(styles.arrowAnchor, styles.next)}
                  label={'Další obrázek'}
                >
                  <button
                    aria-label={'Další obrázek'}
                    className={styles.iconButton}
                    onClick={showNext}
                    type={'button'}
                  >
                    <KeyboardArrowRightIcon />
                  </button>
                </Tooltip>
              </>
            )}

            {image.description && (
              <figcaption className={styles.caption}>
                <div className={styles.captionColumn}>{image.description}</div>
              </figcaption>
            )}
          </figure>

          {/* While open, the neighbours load ahead, so paging doesn't wait. */}
          <div hidden>
            {neighbours.map((neighbourIndex) => {
              const neighbour = images[neighbourIndex]

              return (
                neighbour && (
                  <Image
                    {...neighbour.sources}
                    key={neighbour.id}
                    loading={'eager'}
                    sizes={'100vw'}
                  />
                )
              )
            })}
          </div>
        </>
      )}
    </dialog>
  )
}
